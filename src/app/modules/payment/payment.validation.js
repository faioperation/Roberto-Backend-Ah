import { z } from "zod";

const createCheckoutSessionZodSchema = z.object({
  body: z.object({
    planId: z.string({
      required_error: "Plan ID is required",
    }),
    billingCycle: z.enum(["monthly", "yearly"], {
      required_error: "Billing Cycle is required",
      invalid_type_error: "Billing cycle must be 'monthly' or 'yearly'",
    }),
  }),
});

export const PaymentValidation = {
  createCheckoutSessionZodSchema,
};
