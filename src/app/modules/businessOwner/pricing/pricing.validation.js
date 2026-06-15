import { z } from "zod";

const createPricingSchema = z.object({
    body: z.object({
        ruleName: z.string({ required_error: "Rule name is required" }),
        type: z.string().optional(),
        configuration: z.union([z.string(), z.record(z.any()), z.array(z.any())]).optional(),
        status: z.boolean().optional(),
        branchId: z.string().uuid("Invalid branch ID format").optional(),
    }),
});

const updatePricingSchema = z.object({
    body: z.object({
        ruleName: z.string().optional(),
        type: z.string().optional(),
        configuration: z.union([z.string(), z.record(z.any()), z.array(z.any())]).optional(),
        status: z.boolean().optional(),
        branchId: z.string().uuid("Invalid branch ID format").optional(),
    }),
});

export const PricingValidation = {
    createPricingSchema,
    updatePricingSchema,
};
