import express from "express";
import { DashboardOverviewBController } from "./dashboardOvervieB.controller.js";
import { checkAuthMiddleware } from "../../../middleware/checkAuthMiddleware.js";
import { Role } from "../../../utils/role.js";

const router = express.Router();

router.get(
    "/overview",
    checkAuthMiddleware(Role.BUSINESS_OWNER),
    DashboardOverviewBController.getDashboardOverview
);

export const DashboardOverviewBRoutes = router;
