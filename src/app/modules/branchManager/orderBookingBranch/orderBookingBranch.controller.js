import { sendResponse } from "../../../utils/sendResponse.js";
import { StatusCodes } from "http-status-codes";
import { OrderBookingBranchService } from "./orderBookingBranch.service.js";
import prisma from "../../../prisma/client.js";
import DevBuildError from "../../../lib/DevBuildError.js";

const createOrderBooking = async (req, res, next) => {
    try {
        const managerEmail = req.user?.email;
        
        if (!managerEmail) {
            throw new DevBuildError("User email is missing in token", StatusCodes.UNAUTHORIZED);
        }

        const branchManager = await prisma.branchManager.findUnique({
            where: { email: managerEmail },
            include: { branches: true }
        });

        if (!branchManager) {
            throw new DevBuildError("Branch Manager not found", StatusCodes.BAD_REQUEST);
        }
        
        const branchId = branchManager.branches[0]?.id;
        
        if (!branchId) {
            throw new DevBuildError("Branch Manager does not have an assigned branch", StatusCodes.BAD_REQUEST);
        }

        req.body.businessId = branchManager.businessId;
        req.body.branchId = branchId;
        req.body.createdById = req.user?.id;

        const result = await OrderBookingBranchService.createOrderBookingService(req.body);

        sendResponse(res, {
            statusCode: StatusCodes.CREATED,
            success: true,
            message: "Order Booking created successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getAllOrderBookings = async (req, res, next) => {
    try {
        const managerEmail = req.user?.email;
        const branchManager = await prisma.branchManager.findUnique({
            where: { email: managerEmail },
            include: { branches: true }
        });
        
        if (!branchManager) throw new DevBuildError("Branch Manager not found", StatusCodes.BAD_REQUEST);

        const filter = { 
            businessId: branchManager.businessId,
            branchId: branchManager.branches[0]?.id
        };

        const result = await OrderBookingBranchService.getAllOrderBookingsService(req.query, filter);

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Order Bookings retrieved successfully",
            meta: result.meta,
            data: result.data,
        });
    } catch (error) {
        next(error);
    }
};

const getOrderBookingById = async (req, res, next) => {
    try {
        const managerEmail = req.user?.email;
        const branchManager = await prisma.branchManager.findUnique({
            where: { email: managerEmail },
            include: { branches: true }
        });

        if (!branchManager) throw new DevBuildError("Branch Manager not found", StatusCodes.BAD_REQUEST);

        const filter = { 
            businessId: branchManager.businessId,
            branchId: branchManager.branches[0]?.id
        };

        const result = await OrderBookingBranchService.getOrderBookingByIdService(req.params.id, filter, req.query);

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Order Booking retrieved successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const updateOrderBooking = async (req, res, next) => {
    try {
        const managerEmail = req.user?.email;
        const branchManager = await prisma.branchManager.findUnique({
            where: { email: managerEmail },
            include: { branches: true }
        });

        if (!branchManager) throw new DevBuildError("Branch Manager not found", StatusCodes.BAD_REQUEST);

        const filter = { 
            businessId: branchManager.businessId,
            branchId: branchManager.branches[0]?.id
        };

        const result = await OrderBookingBranchService.updateOrderBookingService(req.params.id, filter, req.body);

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Order Booking updated successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const deleteOrderBooking = async (req, res, next) => {
    try {
        const managerEmail = req.user?.email;
        const branchManager = await prisma.branchManager.findUnique({
            where: { email: managerEmail },
            include: { branches: true }
        });

        if (!branchManager) throw new DevBuildError("Branch Manager not found", StatusCodes.BAD_REQUEST);

        const filter = { 
            businessId: branchManager.businessId,
            branchId: branchManager.branches[0]?.id
        };

        const result = await OrderBookingBranchService.deleteOrderBookingService(req.params.id, filter);

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Order Booking deleted successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const OrderBookingBranchController = {
    createOrderBooking,
    getAllOrderBookings,
    getOrderBookingById,
    updateOrderBooking,
    deleteOrderBooking,
};
