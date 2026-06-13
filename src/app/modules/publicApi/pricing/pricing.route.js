import express from "express";
import { getPricingsByBusinessId } from "./pricing.controller.js";
import { publicApiAuth } from "../../../middleware/publicApiAuth.js";

const router = express.Router();

router.get("/:businessId", publicApiAuth, getPricingsByBusinessId);

export const PublicPricingRoutes = router;
