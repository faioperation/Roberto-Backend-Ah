import { z } from "zod";

const createSubscriptionPlanSchema = z.object({
    body: z.object({
        name: z.string({ required_error: "Name is required" }),
        slug: z.string({ required_error: "Slug is required" }),
        description: z.string().optional(),
        monthlyPrice: z.number({ required_error: "Monthly price is required" }),
        yearlyPrice: z.number().optional(),
        currency: z.string().optional(),
        isActive: z.boolean().optional(),
        sortOrder: z.number().int().optional(),
        features: z.array(z.object({
            key: z.string({ required_error: "Feature key is required" }),
            value: z.string({ required_error: "Feature value is required" })
        })).optional()
    }),
});

const updateSubscriptionPlanSchema = z.object({
    body: z.object({
        name: z.string().optional(),
        slug: z.string().optional(),
        description: z.string().optional(),
        monthlyPrice: z.number().optional(),
        yearlyPrice: z.number().optional(),
        currency: z.string().optional(),
        isActive: z.boolean().optional(),
        sortOrder: z.number().int().optional(),
        features: z.array(z.object({
            key: z.string({ required_error: "Feature key is required" }),
            value: z.string({ required_error: "Feature value is required" })
        })).optional()
    }),
});

export const SubscriptionPlanValidation = {
    createSubscriptionPlanSchema,
    updateSubscriptionPlanSchema,
};
