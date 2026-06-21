import express from "express";
import { getAllCampaigns } from "./campaignPublic.controller.js";
import { publicApiAuth } from "../../../middleware/publicApiAuth.js";

const router = express.Router();

router.get("/:branchId", publicApiAuth, getAllCampaigns);

export const PublicCampaignRoutes = router;
