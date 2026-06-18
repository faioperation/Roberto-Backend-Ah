import prisma from "../../../prisma/client.js";
import { QueryBuilder } from "../../../utils/QueryBuilder.js";

const getAllPublicSubscriptionPlansService = async (query = {}) => {
    const queryBuilder = new QueryBuilder(query)
        .search(["name", "slug", "description"])
        .filter()
        .sort()
        .paginate()
        .fields();

    const queryParams = queryBuilder.build();

    // Only return active plans for public
    queryParams.where = {
        ...queryParams.where,
        isActive: true,
    };

    if (!queryParams.select) {
        queryParams.include = {
            features: true,
        };
    }

    const result = await prisma.subscriptionPlan.findMany(queryParams);
    const total = await prisma.subscriptionPlan.count({
        where: queryParams.where,
    });

    return {
        meta: queryBuilder.getMeta(total),
        data: result,
    };
};

const getPublicSubscriptionPlanByIdService = async (id) => {
    const result = await prisma.subscriptionPlan.findUnique({
        where: { id },
        include: { features: true },
    });

    if (!result || !result.isActive) {
        const DevBuildError = (await import("../../../lib/DevBuildError.js")).default;
        const { StatusCodes } = await import("http-status-codes");
        throw new DevBuildError("Subscription plan not found", StatusCodes.NOT_FOUND);
    }

    return result;
};

export const PublicSubscriptionService = {
    getAllPublicSubscriptionPlansService,
    getPublicSubscriptionPlanByIdService,
};
