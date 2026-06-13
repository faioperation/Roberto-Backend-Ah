import express from "express";
import { getChatSummaryByConversation } from "./chatSummary.controller.js";
import { checkAuthMiddleware } from "../../middleware/checkAuthMiddleware.js";
import { Role } from "../../utils/role.js";

const router = express.Router();

router.get(
    "/:conversationId",
    checkAuthMiddleware(Role.BUSINESS_OWNER, Role.BRANCH_MANAGER),
    getChatSummaryByConversation
);

export const ChatSummaryRoutes = router;
