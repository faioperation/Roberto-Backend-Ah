import express from "express";
import { PublicSubscriptionController } from "./subscriptionPlan.controller.js";

const router = express.Router();

// GET /public/subscription-plans — No auth required
router.get("/", PublicSubscriptionController.getAllSubscriptionPlans);

// GET /public/subscription-plans/:id — No auth required
router.get("/:id", PublicSubscriptionController.getSubscriptionPlanById);

export const PublicSubscriptionRoutes = router;
