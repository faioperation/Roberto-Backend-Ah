import express from "express";
import { CampaignController } from "./campaign.controller.js";
import validateRequest from "../../../middleware/validateRequest.js";
import { CampaignValidation } from "./campaign.validation.js";
import { checkAuthMiddleware } from "../../../middleware/checkAuthMiddleware.js";
import { Role } from "../../../utils/role.js";

const router = express.Router();

router.post(
    "/create",
    checkAuthMiddleware(Role.BUSINESS_OWNER),
    validateRequest(CampaignValidation.createCampaignSchema),
    CampaignController.createCampaign
);

router.get(
    "/all",
    checkAuthMiddleware(Role.BUSINESS_OWNER),
    CampaignController.getAllCampaigns
);

router.get(
    "/:id",
    checkAuthMiddleware(Role.BUSINESS_OWNER),
    CampaignController.getCampaignById
);

router.patch(
    "/:id",
    checkAuthMiddleware(Role.BUSINESS_OWNER),
    validateRequest(CampaignValidation.updateCampaignSchema),
    CampaignController.updateCampaign
);

router.delete(
    "/:id",
    checkAuthMiddleware(Role.BUSINESS_OWNER),
    CampaignController.deleteCampaign
);

export const CampaignRoutes = router;
