import { z } from "zod";

const createBusinessSchema = z.object({
    body: z.object({
        businessName: z.string({ required_error: "Business name is required" }),
        businessType: z.enum(["Retail", "Service", "Manufacturing", "Tech", "Other"]).optional(),
        description: z.string().optional(),
        ownerName: z.string().optional(),
        ownerEmail: z.string().email("Invalid email address").optional(),
        ownerPassword: z.string().optional(),
        ownerPhone: z.string().optional(),
        planId: z.string().optional(),
        planCycle: z.enum(["MONTHLY", "YEARLY"]).optional(),
        status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING"]).optional(),
        createdById: z.string().uuid("Invalid user ID format").optional(),
        credits: z.number().int().optional(),
    }),
});

const updateBusinessSchema = z.object({
    body: z.object({
        businessName: z.string().optional(),
        businessType: z.enum(["Retail", "Service", "Manufacturing", "Tech", "Other"]).optional(),
        description: z.string().optional(),
        ownerName: z.string().optional(),
        ownerEmail: z.string().email("Invalid email address").optional(),
        ownerPassword: z.string().optional(),
        ownerPhone: z.string().optional(),
        planId: z.string().optional(),
        planCycle: z.enum(["MONTHLY", "YEARLY"]).optional(),
        status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING"]).optional(),
        credits: z.number().int().optional(),
    }),
});

export const BusinessValidation = {
    createBusinessSchema,
    updateBusinessSchema,
};
