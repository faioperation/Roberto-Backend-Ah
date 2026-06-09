import express from "express";
import { BusinessController } from "./businessManagement.controller.js";
import validateRequest from "../../../middleware/validateRequest.js";
import { BusinessValidation } from "./businessManagement.validation.js";
import { checkAuthMiddleware } from "../../../middleware/checkAuthMiddleware.js";
import { Role } from "../../../utils/role.js";

const router = express.Router();

router.post(
    "/create",
    // checkAuthMiddleware(Role.SYSTEM_OWNER),
    validateRequest(BusinessValidation.createBusinessSchema),
    BusinessController.createBusiness
);

router.get(
    "/all",
    checkAuthMiddleware(Role.SYSTEM_OWNER),
    BusinessController.getAllBusinesses
);

router.get(
    "/:id",
    checkAuthMiddleware(Role.SYSTEM_OWNER),
    BusinessController.getBusinessById
);

router.patch(
    "/:id",
    checkAuthMiddleware(Role.SYSTEM_OWNER),
    validateRequest(BusinessValidation.updateBusinessSchema),
    BusinessController.updateBusiness
);

router.delete(
    "/:id",
    checkAuthMiddleware(Role.SYSTEM_OWNER),
    BusinessController.deleteBusiness
);

export const BusinessRoutes = router;
