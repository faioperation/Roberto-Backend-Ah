import express from "express";
import { BookingController } from "./orderBooking.controller.js";
import validateRequest from "../../../middleware/validateRequest.js";
import { BookingValidation } from "./orderBooking.validation.js";
import { checkAuthMiddleware } from "../../../middleware/checkAuthMiddleware.js";
import { Role } from "../../../utils/role.js";

const router = express.Router();

router.post(
    "/create",
    checkAuthMiddleware(Role.BUSINESS_OWNER),
    validateRequest(BookingValidation.createBookingSchema),
    BookingController.createBooking
);

router.get(
    "/all",
    checkAuthMiddleware(Role.BUSINESS_OWNER),
    BookingController.getAllBookings
);

router.get(
    "/:id",
    checkAuthMiddleware(Role.BUSINESS_OWNER),
    BookingController.getBookingById
);

router.patch(
    "/:id",
    checkAuthMiddleware(Role.BUSINESS_OWNER),
    validateRequest(BookingValidation.updateBookingSchema),
    BookingController.updateBooking
);

router.delete(
    "/:id",
    checkAuthMiddleware(Role.BUSINESS_OWNER),
    BookingController.deleteBooking
);

export const OrderBookingRoutes = router;
