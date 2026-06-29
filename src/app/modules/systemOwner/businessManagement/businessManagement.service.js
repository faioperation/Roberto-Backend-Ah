import prisma from "../../../prisma/client.js";
import DevBuildError from "../../../lib/DevBuildError.js";
import { StatusCodes } from "http-status-codes";
import bcrypt from "bcrypt";
import { envVars } from "../../../config/env.js";
import { QueryBuilder } from "../../../utils/QueryBuilder.js";
import { sendEmail } from "../../../utils/sendEmail.js";
import { generateInvoicePdf } from "../../../utils/generateInvoicePdf.js";

const mapBusinessType = (type) => {
    if (!type) return null;
    return String(type).toUpperCase();
};

const formatBusinessResponse = (business) => {
    if (!business) return null;
    return business;
};

// ─────────────────────────────────────────────────────────────────────────────
// Create Business (by System Owner)
// ─────────────────────────────────────────────────────────────────────────────
const createBusinessService = async (payload) => {
    let isSystemOwner = payload.isSystemOwner || false;
    delete payload.isSystemOwner;

    // Keep plain password for email before hashing
    const plainPassword = payload.ownerPassword;

    const result = await prisma.$transaction(async (transactionClient) => {
        let user = null;

        if (!isSystemOwner && payload.createdById) {
            const creator = await transactionClient.user.findUnique({
                where: { id: payload.createdById },
                include: { roles: { include: { role: true } } }
            });
            if (creator) {
                isSystemOwner = creator.roles.some(r => r.role.name === "SYSTEM_OWNER");
            }
        }

        if (payload.ownerEmail && payload.ownerPassword) {
            const existingUser = await transactionClient.user.findUnique({
                where: { email: payload.ownerEmail }
            });

            if (existingUser) {
                throw new DevBuildError("User with this owner email already exists", StatusCodes.BAD_REQUEST);
            }

            const hashedPassword = await bcrypt.hash(
                payload.ownerPassword,
                Number(envVars.BCRYPT_SALT_ROUND || 10)
            );

            user = await transactionClient.user.create({
                data: {
                    firstName:    payload.ownerName || null,
                    email:        payload.ownerEmail,
                    passwordHash: hashedPassword,
                    phone:        payload.ownerPhone || null,
                    isVerified:   true,
                    roles: {
                        create: {
                            role: { connect: { name: "BUSINESS_OWNER" } }
                        }
                    }
                }
            });
        }

        if (!user) {
            throw new DevBuildError("Owner user is required to create a business", StatusCodes.BAD_REQUEST);
        }

        // Create the Business record
        const business = await transactionClient.business.create({
            data: {
                ownerId:      user.id,
                name:         payload.businessName,
                email:        payload.ownerEmail,
                phone:        payload.ownerPhone,
                industry:     payload.industry || null,
                businessType: payload.businessType ? mapBusinessType(payload.businessType) : null,
                status:       payload.status || "ACTIVE",
                description:  payload.description || null,
                planId:       payload.planId || null,
                planCycle:    payload.planCycle || "MONTHLY",
                createdById:  payload.createdById || null,
                credits:      payload.credits || 0,
            }
        });

        // Create active subscription + invoice if a planId is provided
        let newSubscription = null;
        let plan = null;
        if (payload.planId) {
            plan = await transactionClient.subscriptionPlan.findUnique({
                where: { id: payload.planId }
            });
            if (plan) {
                const startDate = new Date();
                const endDate   = new Date(startDate);
                if (payload.planCycle === "YEARLY") {
                    endDate.setFullYear(endDate.getFullYear() + 1);
                } else {
                    endDate.setMonth(endDate.getMonth() + 1);
                }

                newSubscription = await transactionClient.businessSubscription.create({
                    data: {
                        businessId:  business.id,
                        planId:      plan.id,
                        status:      "ACTIVE",
                        billingCycle: payload.planCycle === "YEARLY" ? "YEARLY" : "MONTHLY",
                        startDate,
                        endDate,
                    }
                });

                const amount = payload.planCycle === "YEARLY" ? plan.yearlyPrice : plan.monthlyPrice;
                const invoiceNo = `INV-${Date.now()}`;

                await transactionClient.subscriptionInvoice.create({
                    data: {
                        businessId:    business.id,
                        subscriptionId: newSubscription.id,
                        invoiceNo,
                        amount:        amount || 0,
                        status:        "paid",
                        billingCycle:  payload.planCycle === "YEARLY" ? "YEARLY" : "MONTHLY",
                    }
                });
            }
        }

        await transactionClient.activityLog.create({
            data: {
                activityName:  "Business Created",
                activityTitle: `A new business named "${business.name}" has been created.`,
                activityType:  "CREATE",
                createdById:   payload.createdById || null,
            }
        });

        return { business, user, plan, newSubscription };
    });

    const { business, user, plan, newSubscription } = result;

    // ── Post-transaction: generate PDF + send email ────────────────────────
    if (user?.email) {
        let invoiceUrl = null;

        // Generate PDF invoice if a plan was subscribed
        if (plan && newSubscription) {
            try {
                const amount    = payload.planCycle === "YEARLY" ? plan.yearlyPrice : plan.monthlyPrice;
                const startDate = newSubscription.startDate;
                const endDate   = newSubscription.endDate;
                const invoiceNo = `INV-${Date.now()}`;

                const pdfResult = await generateInvoicePdf({
                    invoiceNo,
                    businessName:  business.name,
                    businessEmail: business.email || user.email,
                    planName:      plan.name,
                    billingCycle:  (payload.planCycle || "MONTHLY").toUpperCase(),
                    amount:        amount || 0,
                    currency:      plan.currency || "USD",
                    issuedAt:      new Date(),
                    periodStart:   startDate,
                    periodEnd:     endDate,
                });

                // Update the invoice record with PDF info
                await prisma.subscriptionInvoice.updateMany({
                    where: { businessId: business.id, subscriptionId: newSubscription.id },
                    data:  { invoicePath: pdfResult.invoicePath, invoiceUrl: pdfResult.invoiceUrl },
                });

                invoiceUrl = pdfResult.invoiceUrl;
            } catch (pdfErr) {
                console.error("❌ Failed to generate invoice PDF for new business:", pdfErr);
            }
        }

        // Send welcome email with credentials + business info + invoice
        try {
            const amount = plan
                ? (payload.planCycle === "YEARLY" ? plan.yearlyPrice : plan.monthlyPrice)
                : null;

            const isPending = business.status === "PENDING";

            await sendEmail({
                to:           user.email,
                subject:      isPending 
                    ? "Welcome to Robarto – Finish Setting Up Your Business" 
                    : "Welcome to Robarto – Your Business is Now Live!",
                templateName: isPending ? "businessPendingCreated" : "businessCreated",
                templateData: {
                    ownerName:    payload.ownerName || "Business Owner",
                    ownerEmail:   user.email,
                    ownerPassword: plainPassword,
                    businessName: business.name,
                    businessType: business.businessType || null,
                    planName:     plan?.name    || null,
                    billingCycle: (payload.planCycle || "MONTHLY").toUpperCase(),
                    amount:       amount || 0,
                    currency:     plan?.currency || "USD",
                    invoiceUrl:   invoiceUrl || null,
                    frontendUrl:  envVars.FRONT_END_URL || "http://localhost:3000",
                },
            });
        } catch (emailErr) {
            console.error("❌ Failed to send business creation email:", emailErr);
        }
    }

    return formatBusinessResponse(business);
};

// ─────────────────────────────────────────────────────────────────────────────
// Get All Businesses
// ─────────────────────────────────────────────────────────────────────────────
const getAllBusinessesService = async (query = {}) => {
    const queryBuilder = new QueryBuilder(query)
        .search(["name", "email"])
        .filter()
        .sort()
        .paginate()
        .fields();

    const queryParams = queryBuilder.build();

    if (!queryParams.select) {
        queryParams.include = {
            createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
            owner:     { select: { id: true, email: true, firstName: true, lastName: true } },
            branches:  true,
            subscriptions: {
                where: { status: "ACTIVE" },
                include: { plan: true }
            }
        };
    }

    const result = await prisma.business.findMany(queryParams);
    const total  = await prisma.business.count({ where: queryBuilder.where });

    // Collect all planIds we might need to fetch (if not already included in active subscription)
    const planIdsToFetch = [];
    for (const item of result) {
        const activeSub = item.subscriptions?.find((sub) => sub.status === "ACTIVE");
        if (activeSub) {
            continue;
        }
        if (item.planId) {
            planIdsToFetch.push(item.planId);
        }
    }

    // Fetch any missing plan details from DB
    let fetchedPlans = [];
    if (planIdsToFetch.length > 0) {
        fetchedPlans = await prisma.subscriptionPlan.findMany({
            where: { id: { in: [...new Set(planIdsToFetch)] } }
        });
    }
    const fetchedPlansMap = new Map(fetchedPlans.map((p) => [p.id, p]));

    const formatted = result.map((item) => {
        const activeSub = item.subscriptions?.find((sub) => sub.status === "ACTIVE");
        let plan = activeSub?.plan || null;

        // Fallback to planId lookup if not found via active subscription
        if (!plan && item.planId) {
            plan = fetchedPlansMap.get(item.planId) || null;
        }

        delete item.subscriptions;
        delete item.createdById;
        delete item.planId;
        item.plan = plan;
        return formatBusinessResponse(item);
    });

    const totalTenants = await prisma.business.count();
    const activeTenants = await prisma.business.count({ where: { status: "ACTIVE" } });

    // Calculate MRR from active subscriptions
    const activeSubscriptions = await prisma.businessSubscription.findMany({
        where: {
            status: "ACTIVE",
        },
        include: {
            plan: true,
        },
    });

    let mrr = 0;
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

    return {
        meta: queryBuilder.getMeta(total),
        data: formatted,
        totalTenants,
        activeTenants,
        mrr: Math.round(mrr * 100) / 100,
    };
};

// ─────────────────────────────────────────────────────────────────────────────
// Get Business By ID
// ─────────────────────────────────────────────────────────────────────────────
const getBusinessByIdService = async (id, query = {}) => {
    const queryBuilder = new QueryBuilder(query).fields();
    const queryParams  = queryBuilder.build();

    const findArgs = { where: { id } };

    if (queryParams.select) {
        findArgs.select = queryParams.select;
    } else {
        findArgs.include = {
            createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
            owner:     { select: { id: true, email: true, firstName: true, lastName: true } },
            branches:  true,
            subscriptions: {
                where: { status: "ACTIVE" },
                include: { plan: true }
            }
        };
    }

    const result = await prisma.business.findUnique(findArgs);

    if (!result) {
        throw new DevBuildError("Business not found", StatusCodes.NOT_FOUND);
    }

    const activeSub = result.subscriptions?.find((sub) => sub.status === "ACTIVE");
    let plan = activeSub?.plan || null;

    if (!plan && result.planId) {
        plan = await prisma.subscriptionPlan.findUnique({
            where: { id: result.planId }
        });
    }

    delete result.subscriptions;
    delete result.createdById;
    delete result.planId;
    result.plan = plan;

    return formatBusinessResponse(result);
};

// ─────────────────────────────────────────────────────────────────────────────
// Update Business
// ─────────────────────────────────────────────────────────────────────────────
const updateBusinessService = async (id, payload) => {
    const isExist = await prisma.business.findUnique({ where: { id } });

    if (!isExist) {
        throw new DevBuildError("Business not found", StatusCodes.NOT_FOUND);
    }

    const updateData = { ...payload };
    if (payload.businessName) { updateData.name  = payload.businessName; delete updateData.businessName; }
    if (payload.ownerEmail)   { updateData.email = payload.ownerEmail;   delete updateData.ownerEmail;   }
    if (payload.ownerPhone)   { updateData.phone = payload.ownerPhone;   delete updateData.ownerPhone;   }

    if (payload.industry !== undefined)    updateData.industry     = payload.industry;
    if (payload.businessType !== undefined) {
        updateData.businessType = payload.businessType ? mapBusinessType(payload.businessType) : null;
    }

    const result = await prisma.business.update({ where: { id }, data: updateData });
    return formatBusinessResponse(result);
};

// ─────────────────────────────────────────────────────────────────────────────
// Delete Business
// ─────────────────────────────────────────────────────────────────────────────
const deleteBusinessService = async (id) => {
    const isExist = await prisma.business.findUnique({ where: { id } });

    if (!isExist) {
        throw new DevBuildError("Business not found", StatusCodes.NOT_FOUND);
    }

    const result = await prisma.$transaction(async (transactionClient) => {
        const deletedBusiness = await transactionClient.business.delete({ where: { id } });

        if (isExist.ownerId) {
            await transactionClient.user.delete({ where: { id: isExist.ownerId } });
        }

        return deletedBusiness;
    });

    return formatBusinessResponse(result);
};

export const BusinessService = {
    createBusinessService,
    getAllBusinessesService,
    getBusinessByIdService,
    updateBusinessService,
    deleteBusinessService,
};
