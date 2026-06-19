import express from "express";
import { DashboardOverviewSController } from "./dashboardOverviewS.controller.js";
import { checkAuthMiddleware } from "../../../middleware/checkAuthMiddleware.js";
import { Role } from "../../../utils/role.js";

const router = express.Router();

router.get(
    "/overview",
    checkAuthMiddleware(Role.SYSTEM_OWNER),
    DashboardOverviewSController.getDashboardOverview
);

export const DashboardOverviewSRoutes = router;
