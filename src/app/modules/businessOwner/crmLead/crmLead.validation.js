import { z } from "zod";

const createCrmLeadSchema = z.object({
    body: z.object({
        name: z.string({ required_error: "Name is required" }),
        email: z.string().email("Invalid email").optional().or(z.literal('')),
        phone: z.string().optional(),
        source: z.string().optional(),
        status: z.enum(["COLD", "WARM", "BOOKED", "HOT"]).optional(),
        address: z.string().optional(),
        note: z.string().optional(),
        branchId: z.string().uuid("Invalid branch ID format").optional(),
        conversationId: z.string().uuid("Invalid conversationId format").optional(),
        metadata: z.record(z.string(), z.any()).optional(),
    }).passthrough(),
});

const updateCrmLeadSchema = z.object({
    body: z.object({
        name: z.string().optional(),
        email: z.string().email("Invalid email").optional().or(z.literal('')),
        phone: z.string().optional(),
        source: z.string().optional(),
        status: z.enum(["COLD", "WARM", "BOOKED", "HOT"]).optional(),
        address: z.string().optional(),
        note: z.string().optional(),
        branchId: z.string().uuid("Invalid branch ID format").optional(),
        conversationId: z.string().uuid("Invalid conversationId format").optional(),
        conversation_id: z.string().uuid("Invalid conversationId format").optional(),
        metadata: z.record(z.string(), z.any()).optional(),
    }).passthrough(),
    params: z.object({
        id: z.string().uuid("Invalid lead ID format"),
    }),
});

export const CrmLeadValidation = {
    createCrmLeadSchema,
    updateCrmLeadSchema,
};
