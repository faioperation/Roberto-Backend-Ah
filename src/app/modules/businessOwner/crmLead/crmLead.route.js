import express from "express";
import { CrmLeadController } from "./crmLead.controller.js";
import validateRequest from "../../../middleware/validateRequest.js";
import { CrmLeadValidation } from "./crmLead.validation.js";
import { checkAuthMiddleware } from "../../../middleware/checkAuthMiddleware.js";
import { Role } from "../../../utils/role.js";

const router = express.Router();

router.post(
    "/create",
    checkAuthMiddleware(Role.BUSINESS_OWNER),
    validateRequest(CrmLeadValidation.createCrmLeadSchema),
    CrmLeadController.createCrmLead
);

router.get(
    "/all",
    checkAuthMiddleware(Role.BUSINESS_OWNER),
    CrmLeadController.getAllCrmLeads
);

router.get(
    "/:id",
    checkAuthMiddleware(Role.BUSINESS_OWNER),
    CrmLeadController.getCrmLeadById
);

router.patch(
    "/:id",
    checkAuthMiddleware(Role.BUSINESS_OWNER),
    validateRequest(CrmLeadValidation.updateCrmLeadSchema),
    CrmLeadController.updateCrmLead
);

router.delete(
    "/:id",
    checkAuthMiddleware(Role.BUSINESS_OWNER),
    CrmLeadController.deleteCrmLead
);

export const CrmLeadRoutes = router;
