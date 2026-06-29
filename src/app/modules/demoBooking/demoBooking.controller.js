import { sendResponse } from "../../utils/sendResponse.js";
import { StatusCodes } from "http-status-codes";
import { DemoBookingService } from "./demoBooking.service.js";

const createDemoBooking = async (req, res, next) => {
    try {
        const result = await DemoBookingService.createDemoBookingService(req.body);

        sendResponse(res, {
            statusCode: StatusCodes.CREATED,
            success: true,
            message: "Demo Booking created successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getAllDemoBookings = async (req, res, next) => {
    try {
        const result = await DemoBookingService.getAllDemoBookingsService(req.query);

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Demo Bookings retrieved successfully",
            meta: result.meta,
            data: result.data,
        });
    } catch (error) {
        next(error);
    }
};

const getDemoBookingById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await DemoBookingService.getDemoBookingByIdService(id);

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Demo Booking retrieved successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const updateDemoBooking = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await DemoBookingService.updateDemoBookingService(id, req.body);

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Demo Booking updated successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const deleteDemoBooking = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await DemoBookingService.deleteDemoBookingService(id);

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Demo Booking deleted successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const DemoBookingController = {
    createDemoBooking,
    getAllDemoBookings,
    getDemoBookingById,
    updateDemoBooking,
    deleteDemoBooking,
};
