import { sendResponse } from "../../../utils/sendResponse.js";
import { StatusCodes } from "http-status-codes";
import { OrderBookingService } from "./orderBooking.service.js";
import prisma from "../../../prisma/client.js";
import DevBuildError from "../../../lib/DevBuildError.js";

const createOrderBooking = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        
        if (!userId) {
            throw new DevBuildError("User is not authenticated", StatusCodes.UNAUTHORIZED);
        }

        // Find the business owned by the logged-in user
        const business = await prisma.business.findFirst({
            where: { ownerId: userId }
        });

        if (!business) {
            throw new DevBuildError("No business found for the logged-in user", StatusCodes.BAD_REQUEST);
        }

        req.body.businessId = business.id;
        req.body.createdById = userId;

        const result = await OrderBookingService.createOrderBookingService(req.body);

        sendResponse(res, {
            statusCode: StatusCodes.CREATED,
            success: true,
            message: "Order booking created successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getAllOrderBookings = async (req, res, next) => {
    try {
        const result = await OrderBookingService.getAllOrderBookingsService(req.query);

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Order bookings retrieved successfully",
            meta: result.meta,
            data: result.data,
        });
    } catch (error) {
        next(error);
    }
};

const getOrderBookingById = async (req, res, next) => {
    try {
        const result = await OrderBookingService.getOrderBookingByIdService(req.params.id, req.query);

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Order booking retrieved successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const updateOrderBooking = async (req, res, next) => {
    try {
        const result = await OrderBookingService.updateOrderBookingService(req.params.id, req.body);

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Order booking updated successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const deleteOrderBooking = async (req, res, next) => {
    try {
        const result = await OrderBookingService.deleteOrderBookingService(req.params.id);

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Order booking deleted successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const OrderBookingController = {
    createOrderBooking,
    getAllOrderBookings,
    getOrderBookingById,
    updateOrderBooking,
    deleteOrderBooking,
};
