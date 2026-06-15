import { sendResponse } from "../../../utils/sendResponse.js";
import { StatusCodes } from "http-status-codes";
import { WorkflowService } from "./workflow.service.js";
import prisma from "../../../prisma/client.js";
import DevBuildError from "../../../lib/DevBuildError.js";

const getTenantBusiness = async (userId) => {
    const business = await prisma.business.findFirst({
        where: { ownerId: userId }
    });
    if (!business) {
        throw new DevBuildError("No business found for the logged-in user", StatusCodes.BAD_REQUEST);
    }
    return business;
};

const createWorkflow = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new DevBuildError("User is not authenticated", StatusCodes.UNAUTHORIZED);
        }

        const business = await getTenantBusiness(userId);
        const result = await WorkflowService.createWorkflowService(business.id, req.body);

        sendResponse(res, {
            statusCode: StatusCodes.CREATED,
            success: true,
            message: "Workflow created successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getWorkflows = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new DevBuildError("User is not authenticated", StatusCodes.UNAUTHORIZED);
        }

        const business = await getTenantBusiness(userId);
        const result = await WorkflowService.getWorkflowsService(business.id);

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Workflows retrieved successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const createStage = async (req, res, next) => {
    try {
        const { workflowId } = req.params;
        const result = await WorkflowService.createStageService(workflowId, req.body);

        sendResponse(res, {
            statusCode: StatusCodes.CREATED,
            success: true,
            message: "Workflow stage created successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const reorderStages = async (req, res, next) => {
    try {
        const { stages } = req.body;
        const result = await WorkflowService.reorderStagesService(stages);

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Workflow stages reordered successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const WorkflowController = {
    createWorkflow,
    getWorkflows,
    createStage,
    reorderStages,
};
