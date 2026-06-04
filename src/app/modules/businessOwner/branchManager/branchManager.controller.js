import { sendResponse } from "../../../utils/sendResponse.js";
import { StatusCodes } from "http-status-codes";
import { BranchManagerService } from "./branchManager.service.js";
import prisma from "../../../prisma/client.js";
import DevBuildError from "../../../lib/DevBuildError.js";

const createBranchManager = async (req, res, next) => {
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

        const result = await BranchManagerService.createBranchManagerService(req.body);

        if (result.password) delete result.password;

        sendResponse(res, {
            statusCode: StatusCodes.CREATED,
            success: true,
            message: "Branch Manager created successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getAllBranchManagers = async (req, res, next) => {
    try {
        const result = await BranchManagerService.getAllBranchManagersService(req.query);

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Branch Managers retrieved successfully",
            meta: result.meta,
            data: result.data,
        });
    } catch (error) {
        next(error);
    }
};

const getBranchManagerById = async (req, res, next) => {
    try {
        const result = await BranchManagerService.getBranchManagerByIdService(req.params.id, req.query);

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Branch Manager retrieved successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const updateBranchManager = async (req, res, next) => {
    try {
        const result = await BranchManagerService.updateBranchManagerService(req.params.id, req.body);

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Branch Manager updated successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const deleteBranchManager = async (req, res, next) => {
    try {
        const result = await BranchManagerService.deleteBranchManagerService(req.params.id);

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Branch Manager deleted successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const BranchManagerController = {
    createBranchManager,
    getAllBranchManagers,
    getBranchManagerById,
    updateBranchManager,
    deleteBranchManager,
};
