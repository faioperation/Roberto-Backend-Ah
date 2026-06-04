import { z } from "zod";

const createBranchSchema = z.object({
    body: z.object({
        name: z.string({ required_error: "Branch name is required" }),
        email: z.string().email("Invalid email address").optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        managerId: z.string().uuid("Invalid manager ID format").optional(),
        // businessId and createdById will be fetched from req.user
    }),
});

const updateBranchSchema = z.object({
    body: z.object({
        name: z.string().optional(),
        email: z.string().email("Invalid email address").optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        managerId: z.string().uuid("Invalid manager ID format").optional(),
    }),
});

export const BranchValidation = {
    createBranchSchema,
    updateBranchSchema,
};
