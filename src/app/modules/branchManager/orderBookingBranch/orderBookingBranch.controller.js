import { sendResponse } from "../../../utils/sendResponse.js";
import { StatusCodes } from "http-status-codes";
import { OrderBookingBranchService } from "./orderBookingBranch.service.js";
import prisma from "../../../prisma/client.js";
import DevBuildError from "../../../lib/DevBuildError.js";

// Helper — resolve branchManager's business and branch
const resolveBranchManager = async (userEmail) => {
    if (!userEmail) throw new DevBuildError("User email missing", StatusCodes.UNAUTHORIZED);
    const branchManager = await prisma.branchManager.findUnique({
        where: { email: userEmail },
        include: { branches: true }
    });
    if (!branchManager) throw new DevBuildError("Branch Manager not found", StatusCodes.BAD_REQUEST);
    const branchId = branchManager.branches[0]?.id;
    if (!branchId) throw new DevBuildError("Branch Manager has no assigned branch", StatusCodes.BAD_REQUEST);
    return { businessId: branchManager.businessId, branchId };
};

const createBooking = async (req, res, next) => {
    try {
        const { businessId, branchId } = await resolveBranchManager(req.user?.email);
        req.body.businessId = businessId;
        req.body.branchId = branchId;
        req.body.createdById = req.user?.id;

        const result = await OrderBookingBranchService.createBookingService(req.body);
        sendResponse(res, { statusCode: StatusCodes.CREATED, success: true, message: "Booking created successfully", data: result });
    } catch (error) { next(error); }
};

const getAllBookings = async (req, res, next) => {
    try {
        const { businessId, branchId } = await resolveBranchManager(req.user?.email);
        const filter = { businessId, branchId };
        const result = await OrderBookingBranchService.getAllBookingsService(req.query, filter);
        sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Bookings retrieved successfully", meta: result.meta, data: result.data });
    } catch (error) { next(error); }
};

const getBookingById = async (req, res, next) => {
    try {
        const { businessId, branchId } = await resolveBranchManager(req.user?.email);
        const filter = { businessId, branchId };
        const result = await OrderBookingBranchService.getBookingByIdService(req.params.id, filter, req.query);
        sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Booking retrieved successfully", data: result });
    } catch (error) { next(error); }
};

const updateBooking = async (req, res, next) => {
    try {
        const { businessId, branchId } = await resolveBranchManager(req.user?.email);
        req.body.userId = req.user?.id;
        const filter = { businessId, branchId };
        const result = await OrderBookingBranchService.updateBookingService(req.params.id, filter, req.body);
        sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Booking updated successfully", data: result });
    } catch (error) { next(error); }
};

const deleteBooking = async (req, res, next) => {
    try {
        const { businessId, branchId } = await resolveBranchManager(req.user?.email);
        const filter = { businessId, branchId };
        const result = await OrderBookingBranchService.deleteBookingService(req.params.id, filter);
        sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Booking deleted successfully", data: result });
    } catch (error) { next(error); }
};

export const OrderBookingBranchController = {
    createBooking,
    getAllBookings,
    getBookingById,
    updateBooking,
    deleteBooking,
};
