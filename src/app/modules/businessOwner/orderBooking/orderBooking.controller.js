import { sendResponse } from "../../../utils/sendResponse.js";
import { StatusCodes } from "http-status-codes";
import { BookingService } from "./orderBooking.service.js";
import DevBuildError from "../../../lib/DevBuildError.js";

const createBooking = async (req, res, next) => {
    try {
        req.body.businessId = req.business.id;
        req.body.businessType = req.business.businessType;
        req.body.createdById = req.user.id;

        const result = await BookingService.createBookingService(req.body);
        sendResponse(res, { statusCode: StatusCodes.CREATED, success: true, message: "Booking created successfully", data: result });
    } catch (error) { next(error); }
};

const getAllBookings = async (req, res, next) => {
    try {
        req.query.businessId = req.business.id;
        const result = await BookingService.getAllBookingsService(req.query);
        sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Bookings retrieved successfully", meta: result.meta, data: result.data });
    } catch (error) { next(error); }
};

const getBookingById = async (req, res, next) => {
    try {
        const result = await BookingService.getBookingByIdService(req.business.id, req.params.id, req.query);
        if (result.businessId !== req.business.id) throw new DevBuildError("Unauthorized", StatusCodes.FORBIDDEN);
        sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Booking retrieved successfully", data: result });
    } catch (error) { next(error); }
};

const updateBooking = async (req, res, next) => {
    try {
        req.body.userId = req.user.id;
        const result = await BookingService.updateBookingService(req.business.id, req.params.id, req.body);
        sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Booking updated successfully", data: result });
    } catch (error) { next(error); }
};

const deleteBooking = async (req, res, next) => {
    try {
        const result = await BookingService.deleteBookingService(req.business.id, req.params.id);
        sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Booking deleted successfully", data: result });
    } catch (error) { next(error); }
};

export const BookingController = {
    createBooking,
    getAllBookings,
    getBookingById,
    updateBooking,
    deleteBooking,
};
