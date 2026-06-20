import express from "express";
import { ConversationOffController } from "./conversationOff.controller.js";
import validateRequest from "../../middleware/validateRequest.js";
import { ConversationOffValidation } from "./conversationOff.validation.js";
import { checkAuthMiddleware } from "../../middleware/checkAuthMiddleware.js";
import { Role } from "../../utils/role.js";

const router = express.Router();

router.post(
    "/handoff",
    checkAuthMiddleware(Role.BUSINESS_OWNER, Role.BRANCH_MANAGER),
    validateRequest(ConversationOffValidation.conversationOffSchema),
    ConversationOffController.toggleConversationAi
);

router.get(
    "/:conversationId",
    checkAuthMiddleware(Role.BUSINESS_OWNER, Role.BRANCH_MANAGER),
    ConversationOffController.getConversationAiStatus
);

export const ConversationOffRoutes = router;
