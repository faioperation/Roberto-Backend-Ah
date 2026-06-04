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
        .sort()
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

    return {
        meta: queryBuilder.getMeta(total),
        data: result,
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
