import express from "express";
import { OrderBookingController } from "./orderBooking.controller.js";
import validateRequest from "../../../middleware/validateRequest.js";
import { OrderBookingValidation } from "./orderBooking.validation.js";
import { checkAuthMiddleware } from "../../../middleware/checkAuthMiddleware.js";
import { Role } from "../../../utils/role.js";

const router = express.Router();

router.post(
    "/create",
    checkAuthMiddleware(Role.BUSINESS_OWNER),
    validateRequest(OrderBookingValidation.createOrderBookingSchema),
    OrderBookingController.createOrderBooking
);

router.get(
    "/all",
    checkAuthMiddleware(Role.BUSINESS_OWNER),
    OrderBookingController.getAllOrderBookings
);

router.get(
    "/:id",
    checkAuthMiddleware(Role.BUSINESS_OWNER),
    OrderBookingController.getOrderBookingById
);

router.patch(
    "/:id",
    checkAuthMiddleware(Role.BUSINESS_OWNER),
    validateRequest(OrderBookingValidation.updateOrderBookingSchema),
    OrderBookingController.updateOrderBooking
);

router.delete(
    "/:id",
    checkAuthMiddleware(Role.BUSINESS_OWNER),
    OrderBookingController.deleteOrderBooking
);

export const OrderBookingRoutes = router;
