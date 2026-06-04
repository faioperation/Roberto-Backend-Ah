import { z } from "zod";

const createBranchManagerSchema = z.object({
    body: z.object({
        name: z.string({ required_error: "Name is required" }),
        email: z.string({ required_error: "Email is required" }).email("Invalid email address"),
        password: z.string({ required_error: "Password is required" }).min(6, "Password must be at least 6 characters"),
        status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
        businessId: z.string().uuid("Invalid business ID format").optional(),
        createdById: z.string().uuid("Invalid user ID format").optional(),
    }),
});

const updateBranchManagerSchema = z.object({
    body: z.object({
        name: z.string().optional(),
        email: z.string().email("Invalid email address").optional(),
        password: z.string().min(6, "Password must be at least 6 characters").optional(),
        status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
        businessId: z.string().uuid("Invalid business ID format").optional(),
    }),
});

export const BranchManagerValidation = {
    createBranchManagerSchema,
    updateBranchManagerSchema,
};
