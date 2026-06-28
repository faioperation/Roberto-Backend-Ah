import prisma from "../../../prisma/client.js";
import DevBuildError from "../../../lib/DevBuildError.js";
import { StatusCodes } from "http-status-codes";
import { QueryBuilder } from "../../../utils/QueryBuilder.js";
import { GoogleCalendarService } from "../../googleCalendar/googleCalendar.service.js";

const buildMainPayload = (businessId, payload) => {
    const extracted = {};
    const fields = ["branchId", "createdById", "customerName", "customerNumber", "email", "note", "status"];
    for (const f of fields) {
        if (payload[f] !== undefined) extracted[f] = payload[f];
    }
    if (payload.price !== undefined) extracted.price = String(payload.price);
    extracted.businessId = businessId;
    return extracted;
};

const createAppointmentBookingService = async (payload) => {
    const mainPayload = buildMainPayload(payload.businessId, payload);

    const detailsData = {
        appointmentDate: payload.appointmentDate || null,
        appointmentTime: payload.appointmentTime ? new Date(payload.appointmentTime) : null,
        platform: payload.platform || null,
        duration: payload.duration || null,
    };

    const result = await prisma.$transaction(async (tx) => {
        const booking = await tx.appointmentBooking.create({ data: mainPayload });

        await tx.appointmentDetails.create({
            data: {
                businessId: booking.businessId,
                branchId: booking.branchId,
                appointmentId: booking.id,
                ...detailsData,
            }
        });

        if (payload.paymentStatus || payload.paymentMethod || payload.transactionId) {
            await tx.paymentDetail.create({
                data: {
                    referenceId: booking.id,
                    createdById: mainPayload.createdById || null,
                    paymentStatus: payload.paymentStatus || "PENDING",
                    paymentMethod: payload.paymentMethod || null,
                    transactionId: payload.transactionId || null,
                }
            });
        }

        return await tx.appointmentBooking.findUnique({
            where: { id: booking.id },
            include: { appointmentDetails: true }
        });
    });

    GoogleCalendarService.syncBookingToCalendar(result).catch(err => {
        console.error("Error auto-syncing booking to Google Calendar:", err);
    });

    return result;
};

const getAllAppointmentBookingsService = async (query = {}) => {
    const queryBuilder = new QueryBuilder(query)
        .search(["customerName", "customerNumber", "email"])
        .filter()
        .sort()
        .paginate()
        .fields();

    const queryParams = queryBuilder.build();

    if (!queryParams.select) {
        queryParams.include = {
            appointmentDetails: true,
            createdBy: {
                select: { id: true, email: true, firstName: true, lastName: true }
            }
        };
    }

    const [result, total] = await Promise.all([
        prisma.appointmentBooking.findMany(queryParams),
        prisma.appointmentBooking.count({ where: queryParams.where }),
    ]);

    return { meta: { ...queryBuilder.getMeta(total), totalAppointments: total }, data: result };
};

const getAppointmentBookingByIdService = async (id, query = {}) => {
    const queryBuilder = new QueryBuilder(query).fields();
    const queryParams = queryBuilder.build();
    const findArgs = { where: { id } };

    if (queryParams.select) {
        findArgs.select = queryParams.select;
    } else {
        findArgs.include = {
            appointmentDetails: true,
            createdBy: {
                select: { id: true, email: true, firstName: true, lastName: true }
            }
        };
    }

    const result = await prisma.appointmentBooking.findUnique(findArgs);
    if (!result) throw new DevBuildError("Appointment Booking not found", StatusCodes.NOT_FOUND);
    return result;
};

const updateAppointmentBookingService = async (id, payload) => {
    const isExist = await prisma.appointmentBooking.findUnique({ where: { id } });
    if (!isExist) throw new DevBuildError("Appointment Booking not found", StatusCodes.NOT_FOUND);

    const mainPayload = buildMainPayload(isExist.businessId, payload);
    const { userId } = payload;

    const detailsData = {};
    if (payload.appointmentDate !== undefined) detailsData.appointmentDate = payload.appointmentDate;
    if (payload.appointmentTime !== undefined) detailsData.appointmentTime = payload.appointmentTime ? new Date(payload.appointmentTime) : null;
    if (payload.platform !== undefined) detailsData.platform = payload.platform;
    if (payload.duration !== undefined) detailsData.duration = payload.duration;

    const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.appointmentBooking.update({ where: { id }, data: mainPayload });

        if (Object.keys(detailsData).length > 0) {
            await tx.appointmentDetails.upsert({
                where: { appointmentId: id },
                update: detailsData,
                create: {
                    businessId: updated.businessId,
                    branchId: updated.branchId,
                    appointmentId: id,
                    ...detailsData,
                }
            });
        }

        await tx.auditLog.create({
            data: {
                businessId: updated.businessId,
                userId: userId || null,
                action: "UPDATE",
                targetTable: "AppointmentBooking",
                targetId: id,
                oldValues: { note: isExist.note, price: isExist.price },
                newValues: { note: updated.note, price: updated.price }
            }
        });

        return await tx.appointmentBooking.findUnique({
            where: { id },
            include: { appointmentDetails: true }
        });
    });

    return result;
};

const deleteAppointmentBookingService = async (id) => {
    const isExist = await prisma.appointmentBooking.findUnique({ where: { id } });
    if (!isExist) throw new DevBuildError("Appointment Booking not found", StatusCodes.NOT_FOUND);
    return await prisma.appointmentBooking.delete({ where: { id } });
};

export const AppointmentBookingService = {
    createAppointmentBookingService,
    getAllAppointmentBookingsService,
    getAppointmentBookingByIdService,
    updateAppointmentBookingService,
    deleteAppointmentBookingService,
};
