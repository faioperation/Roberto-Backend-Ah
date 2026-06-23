import express from "express";
import { PricingCalculatorController } from "./pricingCalculator.controller.js";

const router = express.Router();

router.get("/calculate", PricingCalculatorController.calculatePricing);

export const PricingCalculatorRoutes = router;
