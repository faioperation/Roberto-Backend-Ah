import express from "express";
import { TwiloNumberCallController } from "./twiloNumberCall.controller.js";
import validateRequest from "../../../middleware/validateRequest.js";
import { TwiloNumberCallValidation } from "./twiloNumberCall.validation.js";

const router = express.Router();

router.post(
  "/setup-twilio",
  validateRequest(TwiloNumberCallValidation.setupTwilioSchema),
  TwiloNumberCallController.setupTwilio
);

export const TelephonyRoutes = router;
