import express from "express";
import { AppointmentBookingController } from "./appointmentBooking.controller.js";
import validateRequest from "../../../middleware/validateRequest.js";
import { AppointmentBookingValidation } from "./appointmentBooking.validation.js";
import { checkAuthMiddleware } from "../../../middleware/checkAuthMiddleware.js";
import { Role } from "../../../utils/role.js";

const router = express.Router();

router.post(
    "/create",
    checkAuthMiddleware(Role.BUSINESS_OWNER),
    validateRequest(AppointmentBookingValidation.createAppointmentBookingSchema),
    AppointmentBookingController.createAppointmentBooking
);

router.get(
    "/all",
    checkAuthMiddleware(Role.BUSINESS_OWNER),
    AppointmentBookingController.getAllAppointmentBookings
);

router.get(
    "/:id",
    checkAuthMiddleware(Role.BUSINESS_OWNER),
    AppointmentBookingController.getAppointmentBookingById
);

router.patch(
    "/:id",
    checkAuthMiddleware(Role.BUSINESS_OWNER),
    validateRequest(AppointmentBookingValidation.updateAppointmentBookingSchema),
    AppointmentBookingController.updateAppointmentBooking
);

router.delete(
    "/:id",
    checkAuthMiddleware(Role.BUSINESS_OWNER),
    AppointmentBookingController.deleteAppointmentBooking
);

export const AppointmentBookingRoutes = router;
