import prisma from "../../../prisma/client.js";
import DevBuildError from "../../../lib/DevBuildError.js";
import { StatusCodes } from "http-status-codes";
import { QueryBuilder } from "../../../utils/QueryBuilder.js";

const createOrderBookingService = async (payload) => {
    const result = await prisma.orderBooking.create({
        data: payload,
    });
    return result;
};

const getAllOrderBookingsService = async (query = {}, filter = {}) => {
    const queryBuilder = new QueryBuilder(query)
        .search(["customerName", "customerNumber", "email", "productName"])
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

    const result = await prisma.orderBooking.findMany(queryParams);
    const total = await prisma.orderBooking.count({ where: queryParams.where });

    return {
        meta: queryBuilder.getMeta(total),
        data: result,
    };
};

const getOrderBookingByIdService = async (id, filter = {}, query = {}) => {
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

    const result = await prisma.orderBooking.findUnique(findArgs);
    
    if (!result) {
        throw new DevBuildError("Order Booking not found", StatusCodes.NOT_FOUND);
    }

    return result;
};

const updateOrderBookingService = async (id, filter, payload) => {
    const isExist = await prisma.orderBooking.findUnique({
        where: { id, ...filter },
    });

    if (!isExist) {
        throw new DevBuildError("Order Booking not found or you don't have access", StatusCodes.NOT_FOUND);
    }

    const result = await prisma.orderBooking.update({
        where: { id },
        data: payload,
    });
    
    return result;
};

const deleteOrderBookingService = async (id, filter) => {
    const isExist = await prisma.orderBooking.findUnique({
        where: { id, ...filter },
    });

    if (!isExist) {
        throw new DevBuildError("Order Booking not found or you don't have access", StatusCodes.NOT_FOUND);
    }

    const result = await prisma.orderBooking.delete({
        where: { id },
    });
    
    return result;
};

export const OrderBookingBranchService = {
    createOrderBookingService,
    getAllOrderBookingsService,
    getOrderBookingByIdService,
    updateOrderBookingService,
    deleteOrderBookingService,
};
