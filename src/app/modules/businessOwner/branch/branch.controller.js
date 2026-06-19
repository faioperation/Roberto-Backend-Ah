import { sendResponse } from "../../../utils/sendResponse.js";
import { StatusCodes } from "http-status-codes";
import { BranchService } from "./branch.service.js";
import DevBuildError from "../../../lib/DevBuildError.js";

const createBranch = async (req, res, next) => {
    try {
        req.body.businessId = req.business.id;
        req.body.createdById = req.user.id;

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
        // Filter by owner's businessId
        req.query.businessId = req.business.id;
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

        // Ownership check
        if (result.businessId !== req.business.id) {
            throw new DevBuildError("You are not authorized to access this branch", StatusCodes.FORBIDDEN);
        }

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
        const existing = await BranchService.getBranchByIdService(req.params.id, {});
        if (existing.businessId !== req.business.id) {
            throw new DevBuildError("You are not authorized to update this branch", StatusCodes.FORBIDDEN);
        }

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
        const existing = await BranchService.getBranchByIdService(req.params.id, {});
        if (existing.businessId !== req.business.id) {
            throw new DevBuildError("You are not authorized to delete this branch", StatusCodes.FORBIDDEN);
        }

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
