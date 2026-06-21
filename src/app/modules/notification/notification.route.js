import express from "express";
import { checkAuthMiddleware } from "../../middleware/checkAuthMiddleware.js";
import { NotificationController } from "./notification.controller.js";

const router = express.Router();

// Enforce auth on all notification endpoints
router.use(checkAuthMiddleware());

router.get("/", NotificationController.getNotifications);
router.patch("/read-all", NotificationController.markAllAsRead);
router.patch("/:id/read", NotificationController.markAsRead);
router.post("/token", NotificationController.saveFCMToken);

export const NotificationRoutes = router;
