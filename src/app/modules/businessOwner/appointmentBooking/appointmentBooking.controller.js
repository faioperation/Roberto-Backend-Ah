import { sendResponse } from "../../../utils/sendResponse.js";
import { StatusCodes } from "http-status-codes";
import { AppointmentBookingService } from "./appointmentBooking.service.js";
import DevBuildError from "../../../lib/DevBuildError.js";

const createAppointmentBooking = async (req, res, next) => {
    try {
        req.body.businessId = req.business.id;
        req.body.createdById = req.user.id;
        const result = await AppointmentBookingService.createAppointmentBookingService(req.body);
        sendResponse(res, { statusCode: StatusCodes.CREATED, success: true, message: "Appointment booking created successfully", data: result });
    } catch (error) { next(error); }
};

const getAllAppointmentBookings = async (req, res, next) => {
    try {
        req.query.businessId = req.business.id;
        const result = await AppointmentBookingService.getAllAppointmentBookingsService(req.query);
        sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Appointment bookings retrieved successfully", meta: result.meta, data: result.data });
    } catch (error) { next(error); }
};

const getAppointmentBookingById = async (req, res, next) => {
    try {
        const result = await AppointmentBookingService.getAppointmentBookingByIdService(req.params.id, req.query);
        if (result.businessId !== req.business.id) throw new DevBuildError("Unauthorized", StatusCodes.FORBIDDEN);
        sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Appointment booking retrieved successfully", data: result });
    } catch (error) { next(error); }
};

const updateAppointmentBooking = async (req, res, next) => {
    try {
        const existing = await AppointmentBookingService.getAppointmentBookingByIdService(req.params.id, {});
        if (existing.businessId !== req.business.id) throw new DevBuildError("Unauthorized", StatusCodes.FORBIDDEN);
        req.body.userId = req.user.id;
        const result = await AppointmentBookingService.updateAppointmentBookingService(req.params.id, req.body);
        sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Appointment booking updated successfully", data: result });
    } catch (error) { next(error); }
};

const deleteAppointmentBooking = async (req, res, next) => {
    try {
        const existing = await AppointmentBookingService.getAppointmentBookingByIdService(req.params.id, {});
        if (existing.businessId !== req.business.id) throw new DevBuildError("Unauthorized", StatusCodes.FORBIDDEN);
        const result = await AppointmentBookingService.deleteAppointmentBookingService(req.params.id);
        sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Appointment booking deleted successfully", data: result });
    } catch (error) { next(error); }
};

export const AppointmentBookingController = {
    createAppointmentBooking,
    getAllAppointmentBookings,
    getAppointmentBookingById,
    updateAppointmentBooking,
    deleteAppointmentBooking,
};
