import prisma from "../../../prisma/client.js";
import DevBuildError from "../../../lib/DevBuildError.js";
import { StatusCodes } from "http-status-codes";
import { QueryBuilder } from "../../../utils/QueryBuilder.js";
import { extractBookingPayload } from "../../../utils/workflowHelpers.js";

const createOrderBookingService = async (payload) => {
    const cleanPayload = await extractBookingPayload(payload.businessId, payload);

    const result = await prisma.orderBooking.create({
        data: cleanPayload,
        include: {
            stage: true,
        }
    });

    return result;
};

const getAllOrderBookingsService = async (query = {}, filter = {}) => {
    const queryBuilder = new QueryBuilder(query)
        .search(["customerName", "customerNumber", "email"])
        .filter()
        .sort()
        .paginate()
        .fields();

    const queryParams = queryBuilder.build();
    queryParams.where = { ...queryParams.where, ...filter };

    if (!queryParams.select) {
        queryParams.include = {
            stage: true,
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
            stage: true,
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

    const cleanPayload = await extractBookingPayload(isExist.businessId, payload);
    const { userId } = payload; // Actor ID

    const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.orderBooking.update({
            where: { id },
            data: cleanPayload,
            include: {
                stage: true,
            }
        });

        // Log to Audit Log
        await tx.auditLog.create({
            data: {
                businessId: updated.businessId,
                userId: userId || null,
                action: cleanPayload.stageId && cleanPayload.stageId !== isExist.stageId ? "STATUS_CHANGE" : "UPDATE",
                targetTable: "OrderBooking",
                targetId: id,
                oldValues: { stageId: isExist.stageId, metadata: isExist.metadata },
                newValues: { stageId: updated.stageId, metadata: updated.metadata }
            }
        });

        return updated;
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
