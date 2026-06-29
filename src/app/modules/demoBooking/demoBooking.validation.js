import { z } from "zod";

const createDemoBookingSchema = z.object({
    body: z.object({
        name: z.string({ required_error: "Name is required" }),
        email: z.string({ required_error: "Email is required" }).email("Invalid email address"),
        subject: z.string({ required_error: "Subject is required" }),
        description: z.string({ required_error: "Description is required" }),
    }),
});

const updateDemoBookingSchema = z.object({
    body: z.object({
        name: z.string().optional(),
        email: z.string().email("Invalid email address").optional(),
        subject: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(["PENDING", "CALLED", "FAILED"]).optional(),
    }),
    params: z.object({
        id: z.string().uuid("Invalid booking ID format"),
    }),
});

export const DemoBookingValidation = {
    createDemoBookingSchema,
    updateDemoBookingSchema,
};
