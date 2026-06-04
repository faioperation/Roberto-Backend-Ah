import { z } from "zod";

const createCrmLeadSchema = z.object({
    body: z.object({
        name: z.string({ required_error: "Name is required" }),
        email: z.string().email("Invalid email").optional().or(z.literal('')),
        phone: z.string().optional(),
        source: z.enum(["WEBSITE", "SOCIAL_MEDIA", "REFERRAL", "COLD_CALL", "OTHER"]).optional(),
        status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST"]).optional(),
        address: z.string().optional(),
        note: z.string().optional(),
        branchId: z.string().uuid("Invalid branch ID format").optional(),
    }),
});

const updateCrmLeadSchema = z.object({
    body: z.object({
        name: z.string().optional(),
        email: z.string().email("Invalid email").optional().or(z.literal('')),
        phone: z.string().optional(),
        source: z.enum(["WEBSITE", "SOCIAL_MEDIA", "REFERRAL", "COLD_CALL", "OTHER"]).optional(),
        status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST"]).optional(),
        address: z.string().optional(),
        note: z.string().optional(),
        branchId: z.string().uuid("Invalid branch ID format").optional(),
    }),
});

export const CrmLeadValidation = {
    createCrmLeadSchema,
    updateCrmLeadSchema,
};
