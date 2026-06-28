import express from "express";
import { GoogleCalendarController } from "./googleCalendar.controller.js";
import { checkAuthMiddleware } from "../../middleware/checkAuthMiddleware.js";
import { Role } from "../../utils/role.js";

const router = express.Router();

router.get(
  "/google/calendar/connect",
  checkAuthMiddleware(Role.BUSINESS_OWNER, Role.BRANCH_MANAGER),
  GoogleCalendarController.getAuthUrl
);

// Callback route. Google redirects to this URI after successful authentication.
router.get(
  "/google/calendar/callback",
  GoogleCalendarController.handleCallback
);

router.get(
  "/google/calendar/status",
  checkAuthMiddleware(Role.BUSINESS_OWNER, Role.BRANCH_MANAGER),
  GoogleCalendarController.getConnectionStatus
);

router.get(
  "/google/calendar/events",
  checkAuthMiddleware(Role.BUSINESS_OWNER, Role.BRANCH_MANAGER),
  GoogleCalendarController.listEvents
);

router.post(
  "/google/calendar/events",
  checkAuthMiddleware(Role.BUSINESS_OWNER, Role.BRANCH_MANAGER),
  GoogleCalendarController.createEvent
);

router.post(
  "/google/calendar/disconnect",
  checkAuthMiddleware(Role.BUSINESS_OWNER, Role.BRANCH_MANAGER),
  GoogleCalendarController.disconnectCalendar
);

export const GoogleCalendarRoutes = router;
