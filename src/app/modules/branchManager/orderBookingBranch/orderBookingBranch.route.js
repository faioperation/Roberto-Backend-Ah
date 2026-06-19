import express from "express";
import { OrderBookingBranchController } from "./orderBookingBranch.controller.js";
import validateRequest from "../../../middleware/validateRequest.js";
import { BookingValidation } from "../../businessOwner/orderBooking/orderBooking.validation.js";
import { checkAuthMiddleware } from "../../../middleware/checkAuthMiddleware.js";
import { Role } from "../../../utils/role.js";

const router = express.Router();

router.post(
    "/create",
    checkAuthMiddleware(Role.BRANCH_MANAGER),
    validateRequest(BookingValidation.createBookingSchema),
    OrderBookingBranchController.createBooking
);

router.get(
    "/all",
    checkAuthMiddleware(Role.BRANCH_MANAGER),
    OrderBookingBranchController.getAllBookings
);

router.get(
    "/:id",
    checkAuthMiddleware(Role.BRANCH_MANAGER),
    OrderBookingBranchController.getBookingById
);

router.patch(
    "/:id",
    checkAuthMiddleware(Role.BRANCH_MANAGER),
    validateRequest(BookingValidation.updateBookingSchema),
    OrderBookingBranchController.updateBooking
);

router.delete(
    "/:id",
    checkAuthMiddleware(Role.BRANCH_MANAGER),
    OrderBookingBranchController.deleteBooking
);

export const OrderBookingBranchRoutes = router;
