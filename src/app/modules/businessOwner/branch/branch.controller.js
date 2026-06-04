import { sendResponse } from "../../../utils/sendResponse.js";
import { StatusCodes } from "http-status-codes";
import { BranchService } from "./branch.service.js";
import prisma from "../../../prisma/client.js";
import DevBuildError from "../../../lib/DevBuildError.js";

const createBranch = async (req, res, next) => {
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

        const result = await BranchService.createBranchService(req.body);

        sendResponse(res, {
            statusCode: StatusCodes.CREATED,
            success: true,
            message: "Branch created successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getAllBranches = async (req, res, next) => {
    try {
        const result = await BranchService.getAllBranchesService(req.query);

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Branches retrieved successfully",
            meta: result.meta,
            data: result.data,
        });
    } catch (error) {
        next(error);
    }
};

const getBranchById = async (req, res, next) => {
    try {
        const result = await BranchService.getBranchByIdService(req.params.id, req.query);

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Branch retrieved successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const updateBranch = async (req, res, next) => {
    try {
        const result = await BranchService.updateBranchService(req.params.id, req.body);

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Branch updated successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const deleteBranch = async (req, res, next) => {
    try {
        const result = await BranchService.deleteBranchService(req.params.id);

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Branch deleted successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const BranchController = {
    createBranch,
    getAllBranches,
    getBranchById,
    updateBranch,
    deleteBranch,
};
