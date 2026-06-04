import express from "express";
import { ActivityLogController } from "./activityLog.controller.js";
import validateRequest from "../../../middleware/validateRequest.js";
import { ActivityLogValidation } from "./activityLog.validation.js";
import { checkAuthMiddleware } from "../../../middleware/checkAuthMiddleware.js";
import { Role } from "../../../utils/role.js";

const router = express.Router();

router.post(
    "/create",
    checkAuthMiddleware(Role.SYSTEM_OWNER),
    validateRequest(ActivityLogValidation.createActivityLogSchema),
    ActivityLogController.createActivityLog
);

router.get(
    "/all",
    checkAuthMiddleware(Role.SYSTEM_OWNER),
    ActivityLogController.getAllActivityLogs
);

router.get(
    "/:id",
    checkAuthMiddleware(Role.SYSTEM_OWNER),
    ActivityLogController.getActivityLogById
);

router.patch(
    "/:id",
    checkAuthMiddleware(Role.SYSTEM_OWNER),
    validateRequest(ActivityLogValidation.updateActivityLogSchema),
    ActivityLogController.updateActivityLog
);

router.delete(
    "/:id",
    checkAuthMiddleware(Role.SYSTEM_OWNER),
    ActivityLogController.deleteActivityLog
);

export const ActivityLogRoutes = router;
