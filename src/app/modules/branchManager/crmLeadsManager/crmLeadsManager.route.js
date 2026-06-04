import express from "express";
import { CrmLeadsManagerController } from "./crmLeadsManager.controller.js";
import validateRequest from "../../../middleware/validateRequest.js";
import { CrmLeadsManagerValidation } from "./crmLeadsManager.validation.js";
import { checkAuthMiddleware } from "../../../middleware/checkAuthMiddleware.js";
import { Role } from "../../../utils/role.js";

const router = express.Router();

router.post(
    "/create",
    checkAuthMiddleware(Role.BRANCH_MANAGER),
    validateRequest(CrmLeadsManagerValidation.createCrmLeadSchema),
    CrmLeadsManagerController.createCrmLead
);

router.get(
    "/all",
    checkAuthMiddleware(Role.BRANCH_MANAGER),
    CrmLeadsManagerController.getAllCrmLeads
);

router.get(
    "/:id",
    checkAuthMiddleware(Role.BRANCH_MANAGER),
    CrmLeadsManagerController.getCrmLeadById
);

router.patch(
    "/:id",
    checkAuthMiddleware(Role.BRANCH_MANAGER),
    validateRequest(CrmLeadsManagerValidation.updateCrmLeadSchema),
    CrmLeadsManagerController.updateCrmLead
);

router.delete(
    "/:id",
    checkAuthMiddleware(Role.BRANCH_MANAGER),
    CrmLeadsManagerController.deleteCrmLead
);

export const CrmLeadsManagerRoutes = router;
