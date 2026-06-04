import express from "express";
import { AgentTrainingController } from "./agentTraining.controller.js";
import validateRequest from "../../../middleware/validateRequest.js";
import { AgentTrainingValidation } from "./agentTraining.validation.js";
import { checkAuthMiddleware } from "../../../middleware/checkAuthMiddleware.js";
import { Role } from "../../../utils/role.js";
import { createMulterUpload } from "../../../config/multer.config.js";

const router = express.Router();
const upload = createMulterUpload({ folder: "agentTraining", allowedTypes: /.*/ });

router.post(
    "/create",
    checkAuthMiddleware(Role.SYSTEM_OWNER),
    upload.fields([
        { name: 'productInformation', maxCount: 10 },
        { name: 'policiesGuidelines', maxCount: 10 },
        { name: 'faq', maxCount: 10 }
    ]),
    validateRequest(AgentTrainingValidation.createAgentTrainingSchema),
    AgentTrainingController.createAgentTraining
);

router.get(
    "/all",
    checkAuthMiddleware(Role.SYSTEM_OWNER),
    AgentTrainingController.getAllAgentTrainings
);

router.get(
    "/:id",
    checkAuthMiddleware(Role.SYSTEM_OWNER),
    AgentTrainingController.getAgentTrainingById
);

router.patch(
    "/:id",
    checkAuthMiddleware(Role.SYSTEM_OWNER),
    upload.fields([
        { name: 'productInformation', maxCount: 10 },
        { name: 'policiesGuidelines', maxCount: 10 },
        { name: 'faq', maxCount: 10 }
    ]),
    validateRequest(AgentTrainingValidation.updateAgentTrainingSchema),
    AgentTrainingController.updateAgentTraining
);

router.delete(
    "/:id",
    checkAuthMiddleware(Role.SYSTEM_OWNER),
    AgentTrainingController.deleteAgentTraining
);

export const AgentTrainingRoutes = router;
