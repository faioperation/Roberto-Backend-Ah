import express from "express";
import { PricingBranchController } from "./pricingBranch.controller.js";
import validateRequest from "../../../middleware/validateRequest.js";
import { PricingBranchValidation } from "./pricingBranch.validation.js";
import { checkAuthMiddleware } from "../../../middleware/checkAuthMiddleware.js";
import { Role } from "../../../utils/role.js";

const router = express.Router();

router.post(
    "/create",
    checkAuthMiddleware(Role.BRANCH_MANAGER),
    validateRequest(PricingBranchValidation.createPricingBranchSchema),
    PricingBranchController.createPricing
);

router.get(
    "/all",
    checkAuthMiddleware(Role.BRANCH_MANAGER),
    PricingBranchController.getAllPricings
);

router.get(
    "/:id",
    checkAuthMiddleware(Role.BRANCH_MANAGER),
    PricingBranchController.getPricingById
);

router.patch(
    "/:id",
    checkAuthMiddleware(Role.BRANCH_MANAGER),
    validateRequest(PricingBranchValidation.updatePricingBranchSchema),
    PricingBranchController.updatePricing
);

router.delete(
    "/:id",
    checkAuthMiddleware(Role.BRANCH_MANAGER),
    PricingBranchController.deletePricing
);

export const PricingBranchRoutes = router;
