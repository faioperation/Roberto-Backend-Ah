import express from "express";
import { OrderBookingBranchController } from "./orderBookingBranch.controller.js";
import validateRequest from "../../../middleware/validateRequest.js";
import { OrderBookingBranchValidation } from "./orderBookingBranch.validation.js";
import { checkAuthMiddleware } from "../../../middleware/checkAuthMiddleware.js";
import { Role } from "../../../utils/role.js";

const router = express.Router();

router.post(
    "/create",
    checkAuthMiddleware(Role.BRANCH_MANAGER),
    validateRequest(OrderBookingBranchValidation.createOrderBookingSchema),
    OrderBookingBranchController.createOrderBooking
);

router.get(
    "/all",
    checkAuthMiddleware(Role.BRANCH_MANAGER),
    OrderBookingBranchController.getAllOrderBookings
);

router.get(
    "/:id",
    checkAuthMiddleware(Role.BRANCH_MANAGER),
    OrderBookingBranchController.getOrderBookingById
);

router.patch(
    "/:id",
    checkAuthMiddleware(Role.BRANCH_MANAGER),
    validateRequest(OrderBookingBranchValidation.updateOrderBookingSchema),
    OrderBookingBranchController.updateOrderBooking
);

router.delete(
    "/:id",
    checkAuthMiddleware(Role.BRANCH_MANAGER),
    OrderBookingBranchController.deleteOrderBooking
);

export const OrderBookingBranchRoutes = router;
