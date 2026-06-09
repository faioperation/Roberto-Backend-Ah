import { Router } from "express";
import { PaymentController } from "./payment.controller.js";
import { checkAuthMiddleware } from "../../middleware/checkAuthMiddleware.js";
import validateRequest from "../../middleware/validateRequest.js";
import { PaymentValidation } from "./payment.validation.js";

const router = Router();

router.post(
  "/create-checkout-session",
  checkAuthMiddleware("BUSINESS_OWNER"),
  validateRequest(PaymentValidation.createCheckoutSessionZodSchema),
  PaymentController.createCheckoutSession,
);

router.get(
  "/my-subscription",
  checkAuthMiddleware("BUSINESS_OWNER"),
  PaymentController.getMySubscription,
);

router.post("/webhook", PaymentController.handleWebhook);

export const PaymentRouter = router;
