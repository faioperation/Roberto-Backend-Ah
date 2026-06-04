import express from "express";
import { PricingController } from "./pricing.controller.js";
import validateRequest from "../../../middleware/validateRequest.js";
import { PricingValidation } from "./pricing.validation.js";
import { checkAuthMiddleware } from "../../../middleware/checkAuthMiddleware.js";
import { Role } from "../../../utils/role.js";

const router = express.Router();

router.post(
    "/create",
    checkAuthMiddleware(Role.BUSINESS_OWNER),
    validateRequest(PricingValidation.createPricingSchema),
    PricingController.createPricing
);

router.get(
    "/all",
    checkAuthMiddleware(Role.BUSINESS_OWNER),
    PricingController.getAllPricings
);

router.get(
    "/:id",
    checkAuthMiddleware(Role.BUSINESS_OWNER),
    PricingController.getPricingById
);

router.patch(
    "/:id",
    checkAuthMiddleware(Role.BUSINESS_OWNER),
    validateRequest(PricingValidation.updatePricingSchema),
    PricingController.updatePricing
);

router.delete(
    "/:id",
    checkAuthMiddleware(Role.BUSINESS_OWNER),
    PricingController.deletePricing
);

export const PricingRoutes = router;
