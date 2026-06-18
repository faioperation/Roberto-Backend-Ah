import express from "express";
import { DashboardOverviewMController } from "./dashboardOverviewM.controller.js";
import { checkAuthMiddleware } from "../../../middleware/checkAuthMiddleware.js";
import { Role } from "../../../utils/role.js";

const router = express.Router();

router.get(
    "/overview",
    checkAuthMiddleware(Role.BRANCH_MANAGER),
    DashboardOverviewMController.getDashboardOverview
);

export const DashboardOverviewMRoutes = router;
