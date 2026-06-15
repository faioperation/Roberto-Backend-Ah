import express from "express";
import { WorkflowController } from "./workflow.controller.js";
import validateRequest from "../../../middleware/validateRequest.js";
import { WorkflowValidation } from "./workflow.validation.js";
import { checkAuthMiddleware } from "../../../middleware/checkAuthMiddleware.js";
import { Role } from "../../../utils/role.js";

const router = express.Router();

router.post(
    "/create",
    checkAuthMiddleware(Role.BUSINESS_OWNER),
    validateRequest(WorkflowValidation.createWorkflowSchema),
    WorkflowController.createWorkflow
);

router.get(
    "/all",
    checkAuthMiddleware(Role.BUSINESS_OWNER),
    WorkflowController.getWorkflows
);

router.post(
    "/stages/:workflowId",
    checkAuthMiddleware(Role.BUSINESS_OWNER),
    validateRequest(WorkflowValidation.createStageSchema),
    WorkflowController.createStage
);

router.patch(
    "/stages/reorder",
    checkAuthMiddleware(Role.BUSINESS_OWNER),
    validateRequest(WorkflowValidation.reorderStagesSchema),
    WorkflowController.reorderStages
);

export const WorkflowRoutes = router;
