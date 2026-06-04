import prisma from "../../../prisma/client.js";
import DevBuildError from "../../../lib/DevBuildError.js";
import { StatusCodes } from "http-status-codes";
import { QueryBuilder } from "../../../utils/QueryBuilder.js";

const createPricingService = async (payload) => {
    const result = await prisma.pricing.create({
        data: payload,
    });
    return result;
};

const getAllPricingsService = async (query = {}, filter = {}) => {
    const queryBuilder = new QueryBuilder(query)
        .search(["ruleName", "type"])
        .filter()
        .sort()
        .paginate()
        .fields();

    const queryParams = queryBuilder.build();
    queryParams.where = { ...queryParams.where, ...filter };

    if (!queryParams.select) {
        queryParams.include = {
            createdBy: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                }
            },
            branch: {
                select: {
                    id: true,
                    name: true
                }
            }
        };
    }

    const result = await prisma.pricing.findMany(queryParams);
    const total = await prisma.pricing.count({ where: queryParams.where });

    return {
        meta: queryBuilder.getMeta(total),
        data: result,
    };
};

const getPricingByIdService = async (id, filter = {}, query = {}) => {
    const queryBuilder = new QueryBuilder(query).fields();
    const queryParams = queryBuilder.build();

    const findArgs = {
        where: { id, ...filter },
    };

    if (queryParams.select) {
        findArgs.select = queryParams.select;
    } else {
        findArgs.include = {
            createdBy: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                }
            },
            branch: {
                select: {
                    id: true,
                    name: true
                }
            }
        };
    }

    const result = await prisma.pricing.findUnique(findArgs);
    
    if (!result) {
        throw new DevBuildError("Pricing not found", StatusCodes.NOT_FOUND);
    }

    return result;
};

const updatePricingService = async (id, filter, payload) => {
    const isExist = await prisma.pricing.findUnique({
        where: { id, ...filter },
    });

    if (!isExist) {
        throw new DevBuildError("Pricing not found or you don't have access", StatusCodes.NOT_FOUND);
    }

    const result = await prisma.pricing.update({
        where: { id },
        data: payload,
    });
    
    return result;
};

const deletePricingService = async (id, filter) => {
    const isExist = await prisma.pricing.findUnique({
        where: { id, ...filter },
    });

    if (!isExist) {
        throw new DevBuildError("Pricing not found or you don't have access", StatusCodes.NOT_FOUND);
    }

    const result = await prisma.pricing.delete({
        where: { id },
    });
    
    return result;
};

export const PricingBranchService = {
    createPricingService,
    getAllPricingsService,
    getPricingByIdService,
    updatePricingService,
    deletePricingService,
};
