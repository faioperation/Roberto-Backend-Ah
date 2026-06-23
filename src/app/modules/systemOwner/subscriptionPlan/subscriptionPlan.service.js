import prisma from "../../../prisma/client.js";
import DevBuildError from "../../../lib/DevBuildError.js";
import { StatusCodes } from "http-status-codes";

import { QueryBuilder } from "../../../utils/QueryBuilder.js";

const createSubscriptionPlanService = async (payload) => {
    const { features, ...planData } = payload;
    
    // First, check if slug is unique
    const existingPlan = await prisma.subscriptionPlan.findUnique({
        where: { slug: planData.slug }
    });

    if (existingPlan) {
        throw new DevBuildError("Subscription plan with this slug already exists", StatusCodes.BAD_REQUEST);
    }

    const result = await prisma.subscriptionPlan.create({
        data: {
            ...planData,
            features: features && features.length > 0 ? {
                create: features
            } : undefined
        },
        include: {
            features: true
        }
    });
    return result;
};

const getAllSubscriptionPlansService = async (query = {}) => {
    const queryBuilder = new QueryBuilder(query)
        .search(["name", "slug", "description"])
        .filter()
        .sort("createdAt")
        .paginate()
        .fields();

    const queryParams = queryBuilder.build();

    if (!queryParams.select) {
        queryParams.include = {
            features: true,
            createdBy: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                }
            }
        };
    }

    const result = await prisma.subscriptionPlan.findMany(queryParams);
    const total = await prisma.subscriptionPlan.count({ where: queryBuilder.where });

    // Calculate MRR, ARR, Active Subs
    const activeSubscriptions = await prisma.businessSubscription.findMany({
        where: {
            status: "ACTIVE",
        },
        include: {
            plan: true,
        },
    });

    let mrr = 0;
    const activeSubsCount = activeSubscriptions.length;

    for (const sub of activeSubscriptions) {
        if (sub.plan) {
            if (sub.billingCycle === "MONTHLY") {
                mrr += sub.plan.monthlyPrice || 0;
            } else if (sub.billingCycle === "YEARLY") {
                const yearlyPrice = sub.plan.yearlyPrice || (sub.plan.monthlyPrice * 12);
                mrr += (yearlyPrice / 12);
            }
        }
    }

    const arr = mrr * 12;

    // Fetch Billing History (all transactions/invoices)
    const invoices = await prisma.subscriptionInvoice.findMany({
        include: {
            business: {
                select: {
                    name: true,
                },
            },
            subscription: {
                include: {
                    plan: {
                        select: {
                            name: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    const billingHistory = invoices.map((invoice) => {
        const planName = invoice.subscription?.plan?.name || "Subscription";
        const billingCycleStr = invoice.billingCycle === "MONTHLY" ? "Monthly" : "Yearly";
        return {
            id: invoice.id,
            date: invoice.createdAt,
            description: `${planName} - ${billingCycleStr}`,
            client: invoice.business?.name || "N/A",
            amount: invoice.amount,
            status: invoice.status ? invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1) : "Paid",
            invoiceUrl: invoice.invoiceUrl,
            invoicePath: invoice.invoicePath,
        };
    });

    return {
        meta: queryBuilder.getMeta(total),
        data: result,
        mrr: Math.round(mrr * 100) / 100,
        arr: Math.round(arr * 100) / 100,
        activeSubs: activeSubsCount,
        billingHistory,
    };
};

const getSubscriptionPlanByIdService = async (id, query = {}) => {
    const queryBuilder = new QueryBuilder(query).fields();
    const queryParams = queryBuilder.build();

    const findArgs = {
        where: { id },
    };

    if (queryParams.select) {
        findArgs.select = queryParams.select;
    } else {
        findArgs.include = {
            features: true,
            createdBy: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                }
            }
        };
    }

    const result = await prisma.subscriptionPlan.findUnique(findArgs);
    
    if (!result) {
        throw new DevBuildError("Subscription plan not found", StatusCodes.NOT_FOUND);
    }

    return result;
};

const updateSubscriptionPlanService = async (id, payload) => {
    const { features, ...planData } = payload;

    const isExist = await prisma.subscriptionPlan.findUnique({
        where: { id },
    });

    if (!isExist) {
        throw new DevBuildError("Subscription plan not found", StatusCodes.NOT_FOUND);
    }

    if (planData.slug && planData.slug !== isExist.slug) {
        const existingSlug = await prisma.subscriptionPlan.findUnique({
            where: { slug: planData.slug }
        });
        if (existingSlug) {
            throw new DevBuildError("Subscription plan with this slug already exists", StatusCodes.BAD_REQUEST);
        }
    }

    const updateData = {
        ...planData,
    };

    if (features) {
        updateData.features = {
            deleteMany: {},
            create: features
        };
    }

    const result = await prisma.subscriptionPlan.update({
        where: { id },
        data: updateData,
        include: {
            features: true
        }
    });
    return result;
};

const deleteSubscriptionPlanService = async (id) => {
    const isExist = await prisma.subscriptionPlan.findUnique({
        where: { id },
    });

    if (!isExist) {
        throw new DevBuildError("Subscription plan not found", StatusCodes.NOT_FOUND);
    }

    await prisma.subscriptionFeature.deleteMany({
        where: { planId: id }
    });

    const result = await prisma.subscriptionPlan.delete({
        where: { id },
    });
    
    return result;
};

export const SubscriptionPlanService = {
    createSubscriptionPlanService,
    getAllSubscriptionPlansService,
    getSubscriptionPlanByIdService,
    updateSubscriptionPlanService,
    deleteSubscriptionPlanService,
};
