import { z } from "zod";

const createPricingBranchSchema = z.object({
    body: z.object({
        ruleName: z.string({ required_error: "Rule name is required" }),
        type: z.string().optional(),
        configuration: z.union([z.string(), z.record(z.string(), z.any()), z.array(z.any())]).optional(),
        status: z.boolean().optional(),
    }),
});

const updatePricingBranchSchema = z.object({
    body: z.object({
        ruleName: z.string().optional(),
        type: z.string().optional(),
        configuration: z.union([z.string(), z.record(z.string(), z.any()), z.array(z.any())]).optional(),
        status: z.boolean().optional(),
    }),
});

export const PricingBranchValidation = {
    createPricingBranchSchema,
    updatePricingBranchSchema,
};
