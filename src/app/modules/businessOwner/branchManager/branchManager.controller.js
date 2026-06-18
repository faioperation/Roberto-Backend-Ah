import { sendResponse } from "../../../utils/sendResponse.js";
import { StatusCodes } from "http-status-codes";
import { BranchManagerService } from "./branchManager.service.js";
import DevBuildError from "../../../lib/DevBuildError.js";

const createBranchManager = async (req, res, next) => {
    try {
        req.body.businessId = req.business.id;
        req.body.createdById = req.user.id;

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
        // Filter by owner's businessId
        req.query.businessId = req.business.id;
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

        // Ownership check
        if (result.businessId !== req.business.id) {
            throw new DevBuildError("You are not authorized to access this branch manager", StatusCodes.FORBIDDEN);
        }

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
        const existing = await BranchManagerService.getBranchManagerByIdService(req.params.id, {});
        if (existing.businessId !== req.business.id) {
            throw new DevBuildError("You are not authorized to update this branch manager", StatusCodes.FORBIDDEN);
        }

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
        const existing = await BranchManagerService.getBranchManagerByIdService(req.params.id, {});
        if (existing.businessId !== req.business.id) {
            throw new DevBuildError("You are not authorized to delete this branch manager", StatusCodes.FORBIDDEN);
        }

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
