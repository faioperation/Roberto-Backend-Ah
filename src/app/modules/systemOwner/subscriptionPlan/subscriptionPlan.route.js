import express from "express";
import { SubscriptionPlanController } from "./subscriptionPlan.controller.js";
import validateRequest from "../../../middleware/validateRequest.js";
import { SubscriptionPlanValidation } from "./subscriptionPlan.validation.js";
import { checkAuthMiddleware } from "../../../middleware/checkAuthMiddleware.js";
import { Role } from "../../../utils/role.js";

const router = express.Router();

router.post(
    "/create",
    checkAuthMiddleware(Role.SYSTEM_OWNER),
    validateRequest(SubscriptionPlanValidation.createSubscriptionPlanSchema),
    SubscriptionPlanController.createSubscriptionPlan
);

router.get(
    "/all",
    checkAuthMiddleware(Role.SYSTEM_OWNER),
    SubscriptionPlanController.getAllSubscriptionPlans
);

router.get(
    "/:id",
    checkAuthMiddleware(Role.SYSTEM_OWNER),
    SubscriptionPlanController.getSubscriptionPlanById
);

router.patch(
    "/:id",
    checkAuthMiddleware(Role.SYSTEM_OWNER),
    validateRequest(SubscriptionPlanValidation.updateSubscriptionPlanSchema),
    SubscriptionPlanController.updateSubscriptionPlan
);

router.delete(
    "/:id",
    checkAuthMiddleware(Role.SYSTEM_OWNER),
    SubscriptionPlanController.deleteSubscriptionPlan
);

export const SubscriptionPlanRoutes = router;
