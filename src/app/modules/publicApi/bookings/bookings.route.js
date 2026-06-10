import express from "express";
import { createBooking } from "./bookings.controller.js";
import { publicApiAuth } from "../../../middleware/publicApiAuth.js";

const router = express.Router();

router.post("/create", publicApiAuth, createBooking);

export const PublicBookingRoutes = router;
