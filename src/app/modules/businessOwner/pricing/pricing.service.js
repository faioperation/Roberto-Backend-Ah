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

const getAllPricingsService = async (query = {}) => {
    const queryBuilder = new QueryBuilder(query)
        .search(["ruleName", "type"])
        .filter()
        .sort()
        .paginate()
        .fields();

    const queryParams = queryBuilder.build();

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
    const total = await prisma.pricing.count({ where: queryBuilder.where });

    const allPricings = await prisma.pricing.findMany({
        where: queryParams.where,
        select: {
            type: true,
            status: true,
        },
    });

    const activeCount = allPricings.filter((pricing) => pricing.status === true).length;

    const uniqueTypes = new Set();
    allPricings.forEach((pricing) => {
        if (pricing.type) {
            uniqueTypes.add(pricing.type.toUpperCase());
        }
    });
    const typeCounts = uniqueTypes.size;

    return {
        meta: {
            ...queryBuilder.getMeta(total),
            activeCount,
            typeCounts,
        },
        data: result,
    };
};

const getPricingByIdService = async (id, query = {}) => {
    const queryBuilder = new QueryBuilder(query).fields();
    const queryParams = queryBuilder.build();

    const findArgs = {
        where: { id },
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

const updatePricingService = async (id, payload) => {
    const isExist = await prisma.pricing.findUnique({
        where: { id },
    });

    if (!isExist) {
        throw new DevBuildError("Pricing not found", StatusCodes.NOT_FOUND);
    }

    const result = await prisma.pricing.update({
        where: { id },
        data: payload,
    });
    
    return result;
};

const deletePricingService = async (id) => {
    const isExist = await prisma.pricing.findUnique({
        where: { id },
    });

    if (!isExist) {
        throw new DevBuildError("Pricing not found", StatusCodes.NOT_FOUND);
    }

    const result = await prisma.pricing.delete({
        where: { id },
    });
    
    return result;
};

export const PricingService = {
    createPricingService,
    getAllPricingsService,
    getPricingByIdService,
    updatePricingService,
    deletePricingService,
};
