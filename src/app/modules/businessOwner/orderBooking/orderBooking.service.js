import prisma from "../../../prisma/client.js";
import DevBuildError from "../../../lib/DevBuildError.js";
import { StatusCodes } from "http-status-codes";
import { QueryBuilder } from "../../../utils/QueryBuilder.js";
import {
    getBookingModel,
    buildMainPayload,
    buildDetailsPayload,
    buildDetailsUpdatePayload,
    saveAdditionalDetails,
    updateAdditionalDetails,
    attachDetails,
} from "../../../utils/bookingHelpers.js";

/**
 * Resolves businessType from business record.
 */
const resolveBusinessType = async (businessId) => {
    const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: { businessType: true },
    });
    return business?.businessType || "ORDER_BOOKING";
};

const createBookingService = async (payload) => {
    const businessType = payload.businessType || await resolveBusinessType(payload.businessId);
    const { model, detailsModel, detailsKey, detailsRelation } = getBookingModel(businessType);

    const mainPayload = buildMainPayload(payload.businessId, payload);

    const result = await prisma.$transaction(async (tx) => {
        const booking = await model.create({ data: mainPayload });

        const detailsPayload = buildDetailsPayload(businessType, payload, booking.id, booking.businessId, booking.branchId);
        await detailsModel.create({ data: detailsPayload });

        // Create payment detail if provided
        const hasPaymentStatus = payload.paymentStatus || payload.paymentDetails?.paymentStatus;
        const hasPaymentMethod = payload.paymentMethod || payload.paymentDetails?.paymentMethod;
        const hasTransactionId = payload.transactionId || payload.paymentDetails?.transactionId;

        if (hasPaymentStatus || hasPaymentMethod || hasTransactionId) {
            await tx.paymentDetail.create({
                data: {
                    referenceId: booking.id,
                    createdById: mainPayload.createdById || null,
                    paymentStatus: hasPaymentStatus || "PENDING",
                    paymentMethod: hasPaymentMethod || null,
                    transactionId: hasTransactionId || null,
                }
            });
        }

        // Save any extra/additional fields
        await saveAdditionalDetails(tx, booking.businessId, booking.branchId, booking.id, payload);

        const createdBooking = await model.findUnique({
            where: { id: booking.id },
            include: { [detailsRelation]: true },
        });

        return await attachDetails(tx, createdBooking);
    });

    return result;
};

const getAllBookingsService = async (query = {}) => {
    const businessId = query.businessId;
    const businessType = await resolveBusinessType(businessId);
    const { model, detailsRelation } = getBookingModel(businessType);

    const queryBuilder = new QueryBuilder(query)
        .search(["customerName", "customerNumber", "email"])
        .filter()
        .sort()
        .paginate()
        .fields();

    const queryParams = queryBuilder.build();

    if (!queryParams.select) {
        queryParams.include = {
            [detailsRelation]: true,
            createdBy: {
                select: { id: true, email: true, firstName: true, lastName: true }
            }
        };
    }

    const [result, total] = await Promise.all([
        model.findMany(queryParams),
        model.count({ where: queryParams.where }),
    ]);

    const formattedData = await attachDetails(prisma, result);

    return { meta: { ...queryBuilder.getMeta(total), total }, data: formattedData };
};

const getBookingByIdService = async (businessId, id, query = {}) => {
    const businessType = await resolveBusinessType(businessId);
    const { model, detailsRelation } = getBookingModel(businessType);

    const queryBuilder = new QueryBuilder(query).fields();
    const queryParams = queryBuilder.build();
    const findArgs = { where: { id } };

    if (queryParams.select) {
        findArgs.select = queryParams.select;
    } else {
        findArgs.include = {
            [detailsRelation]: true,
            createdBy: {
                select: { id: true, email: true, firstName: true, lastName: true }
            }
        };
    }

    const result = await model.findUnique(findArgs);
    if (!result) throw new DevBuildError("Booking not found", StatusCodes.NOT_FOUND);
    return await attachDetails(prisma, result);
};

const updateBookingService = async (businessId, id, payload) => {
    const businessType = await resolveBusinessType(businessId);
    const { model, detailsModel, detailsKey, detailsRelation } = getBookingModel(businessType);

    const isExist = await model.findUnique({ where: { id } });
    if (!isExist) throw new DevBuildError("Booking not found", StatusCodes.NOT_FOUND);

    const mainPayload = buildMainPayload(businessId, payload);
    const detailsUpdateData = buildDetailsUpdatePayload(businessType, payload);
    const { userId } = payload;

    const result = await prisma.$transaction(async (tx) => {
        const updated = await model.update({ where: { id }, data: mainPayload });

        if (Object.keys(detailsUpdateData).length > 0) {
            await detailsModel.upsert({
                where: { [detailsKey]: id },
                update: detailsUpdateData,
                create: buildDetailsPayload(businessType, payload, id, updated.businessId, updated.branchId),
            });
        }

        // Handle payment details updates if provided
        const paymentStatus = payload.paymentStatus || payload.paymentDetails?.paymentStatus;
        const paymentMethod = payload.paymentMethod !== undefined ? payload.paymentMethod : payload.paymentDetails?.paymentMethod;
        const transactionId = payload.transactionId !== undefined ? payload.transactionId : payload.paymentDetails?.transactionId;

        if (paymentStatus || paymentMethod !== undefined || transactionId !== undefined) {
            const existingPayment = await tx.paymentDetail.findFirst({ where: { referenceId: id } });
            if (existingPayment) {
                await tx.paymentDetail.update({
                    where: { id: existingPayment.id },
                    data: {
                        paymentStatus: paymentStatus || existingPayment.paymentStatus,
                        paymentMethod: paymentMethod !== undefined ? paymentMethod : existingPayment.paymentMethod,
                        transactionId: transactionId !== undefined ? transactionId : existingPayment.transactionId,
                    }
                });
            } else {
                await tx.paymentDetail.create({
                    data: {
                        referenceId: id,
                        createdById: userId || null,
                        paymentStatus: paymentStatus || "PENDING",
                        paymentMethod: paymentMethod || null,
                        transactionId: transactionId || null,
                    }
                });
            }
        }

        // Handle additional details updates
        await updateAdditionalDetails(tx, businessId, updated.branchId, id, payload);

        await tx.auditLog.create({
            data: {
                businessId,
                userId: userId || null,
                action: "UPDATE",
                targetTable: businessType,
                targetId: id,
                oldValues: { note: isExist.note, price: isExist.price },
                newValues: { note: updated.note, price: updated.price },
            }
        });

        const updatedBooking = await model.findUnique({
            where: { id },
            include: { [detailsRelation]: true },
        });

        return await attachDetails(tx, updatedBooking);
    });

    return result;
};

const deleteBookingService = async (businessId, id) => {
    const businessType = await resolveBusinessType(businessId);
    const { model } = getBookingModel(businessType);

    const isExist = await model.findUnique({ where: { id } });
    if (!isExist) throw new DevBuildError("Booking not found", StatusCodes.NOT_FOUND);

    return await prisma.$transaction(async (tx) => {
        // Delete payment details
        await tx.paymentDetail.deleteMany({ where: { referenceId: id } });
        // Delete additional details
        await tx.additionalDetail.deleteMany({ where: { referenceId: id } });
        // Delete the booking itself
        return await model.delete({ where: { id } });
    });
};

export const BookingService = {
    createBookingService,
    getAllBookingsService,
    getBookingByIdService,
    updateBookingService,
    deleteBookingService,
};
