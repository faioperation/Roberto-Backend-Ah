import { sendResponse } from "../../../utils/sendResponse.js";
import { StatusCodes } from "http-status-codes";
import { WorkflowService } from "./workflow.service.js";
import DevBuildError from "../../../lib/DevBuildError.js";

const createWorkflow = async (req, res, next) => {
    try {
        const result = await WorkflowService.createWorkflowService(req.business.id, req.body);

        sendResponse(res, { statusCode: StatusCodes.CREATED, success: true, message: "Workflow created successfully", data: result });
    } catch (error) {
        next(error);
    }
};

const getWorkflows = async (req, res, next) => {
    try {
        const result = await WorkflowService.getWorkflowsService(req.business.id);

        sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Workflows retrieved successfully", data: result });
    } catch (error) {
        next(error);
    }
};

const createStage = async (req, res, next) => {
    try {
        const { workflowId } = req.params;

        // Verify the workflow belongs to this business
        const workflow = await WorkflowService.getWorkflowByIdService(workflowId);
        if (!workflow || workflow.businessId !== req.business.id) {
            throw new DevBuildError("You are not authorized to manage this workflow", StatusCodes.FORBIDDEN);
        }

        const result = await WorkflowService.createStageService(workflowId, req.body);

        sendResponse(res, { statusCode: StatusCodes.CREATED, success: true, message: "Workflow stage created successfully", data: result });
    } catch (error) {
        next(error);
    }
};

const reorderStages = async (req, res, next) => {
    try {
        const { stages } = req.body;
        const result = await WorkflowService.reorderStagesService(stages);

        sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Workflow stages reordered successfully", data: result });
    } catch (error) {
        next(error);
    }
};

export const WorkflowController = { createWorkflow, getWorkflows, createStage, reorderStages };
