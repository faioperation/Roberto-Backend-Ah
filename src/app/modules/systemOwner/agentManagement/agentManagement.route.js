import express from "express";
import { AgentController } from "./agentManagement.controller.js";
import validateRequest from "../../../middleware/validateRequest.js";
import { AgentValidation } from "./agentManagement.validation.js";
import { checkAuthMiddleware } from "../../../middleware/checkAuthMiddleware.js";
import { Role } from "../../../utils/role.js";
import { createMulterUpload } from "../../../config/multer.config.js";

const router = express.Router();
const upload = createMulterUpload({ folder: "agents", allowedTypes: /.*/ });

router.post(
    "/create",
    checkAuthMiddleware(Role.SYSTEM_OWNER),
    upload.array("rules_file", 10),
    validateRequest(AgentValidation.createAgentSchema),
    AgentController.createAgent
);

router.get(
    "/all",
    checkAuthMiddleware(Role.SYSTEM_OWNER),
    AgentController.getAllAgents
);

router.get(
    "/:id",
    checkAuthMiddleware(Role.SYSTEM_OWNER),
    AgentController.getAgentById
);

router.patch(
    "/:id",
    checkAuthMiddleware(Role.SYSTEM_OWNER),
    upload.array("rules_file", 10),
    validateRequest(AgentValidation.updateAgentSchema),
    AgentController.updateAgent
);

router.delete(
    "/:id",
    checkAuthMiddleware(Role.SYSTEM_OWNER),
    AgentController.deleteAgent
);

export const AgentManagementRoutes = router;
