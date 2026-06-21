import express from "express";
import { GlobalBusinessController } from "./globalBusiness.controller.js";
import validateRequest from "../../../middleware/validateRequest.js";
import { BusinessValidation } from "../../systemOwner/businessManagement/businessManagement.validation.js";

const router = express.Router();

router.post(
    "/create",
    validateRequest(BusinessValidation.createBusinessSchema),
    GlobalBusinessController.createBusiness
);

export const GlobalBusinessRoutes = router;
