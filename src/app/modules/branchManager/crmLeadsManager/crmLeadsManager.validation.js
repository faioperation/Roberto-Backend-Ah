import { z } from "zod";

const createCrmLeadSchema = z.object({
    body: z.object({
        name: z.string({ required_error: "Name is required" }),
        email: z.string().email("Invalid email format").optional().or(z.literal('')),
        phone: z.string().optional(),
        source: z.string().optional(),
        status: z.string().optional(),
        address: z.string().optional(),
        note: z.string().optional(),
        stageId: z.string().optional(),
        metadata: z.record(z.string(), z.any()).optional(),
    }).passthrough(),
});

const updateCrmLeadSchema = z.object({
    body: z.object({
        name: z.string().optional(),
        email: z.string().email("Invalid email format").optional().or(z.literal('')),
        phone: z.string().optional(),
        source: z.string().optional(),
        status: z.string().optional(),
        address: z.string().optional(),
        note: z.string().optional(),
        stageId: z.string().optional(),
        metadata: z.record(z.string(), z.any()).optional(),
    }).passthrough(),
});

export const CrmLeadsManagerValidation = {
    createCrmLeadSchema,
    updateCrmLeadSchema,
};
