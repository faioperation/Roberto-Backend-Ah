import express from "express";
import { DemoBookingController } from "./demoBooking.controller.js";
import validateRequest from "../../middleware/validateRequest.js";
import { DemoBookingValidation } from "./demoBooking.validation.js";
import { checkAuthMiddleware } from "../../middleware/checkAuthMiddleware.js";
import { Role } from "../../utils/role.js";

const router = express.Router();

router.post(
    "/create",
    validateRequest(DemoBookingValidation.createDemoBookingSchema),
    DemoBookingController.createDemoBooking
);

router.get(
    "/all",
    checkAuthMiddleware(Role.SYSTEM_OWNER),
    DemoBookingController.getAllDemoBookings
);

router.get(
    "/:id",
    checkAuthMiddleware(Role.SYSTEM_OWNER),
    DemoBookingController.getDemoBookingById
);

router.patch(
    "/:id",
    checkAuthMiddleware(Role.SYSTEM_OWNER),
    validateRequest(DemoBookingValidation.updateDemoBookingSchema),
    DemoBookingController.updateDemoBooking
);

router.delete(
    "/:id",
    checkAuthMiddleware(Role.SYSTEM_OWNER),
    DemoBookingController.deleteDemoBooking
);

export const DemoBookingRoutes = router;
