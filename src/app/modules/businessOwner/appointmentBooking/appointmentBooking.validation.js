import { z } from "zod";

const createAppointmentBookingSchema = z.object({
    body: z.object({
        customerName: z.string({ required_error: "Customer name is required" }),
        customerNumber: z.string({ required_error: "Customer number is required" }),
        email: z.string().email("Invalid email").optional().or(z.literal('')),
        price: z.union([z.string(), z.number()]).optional(),
        note: z.string().optional(),
        branchId: z.string().uuid("Invalid branch ID").optional(),

        // appointment details
        appointmentDate: z.string().optional(),
        appointmentTime: z.string().optional(),
        platform: z.string().optional(),
        duration: z.string().optional(),

        // payment
        paymentStatus: z.enum(["PENDING", "COMPLETED", "FAILED", "REFUNDED"]).optional(),
        paymentMethod: z.string().optional(),
        transactionId: z.string().optional(),
    }).passthrough(),
});

const updateAppointmentBookingSchema = z.object({
    body: z.object({
        customerName: z.string().optional(),
        customerNumber: z.string().optional(),
        email: z.string().email("Invalid email").optional().or(z.literal('')),
        price: z.union([z.string(), z.number()]).optional(),
        note: z.string().optional(),
        branchId: z.string().uuid("Invalid branch ID").optional(),

        // appointment details
        appointmentDate: z.string().optional(),
        appointmentTime: z.string().optional(),
        platform: z.string().optional(),
        duration: z.string().optional(),

        // payment
        paymentStatus: z.enum(["PENDING", "COMPLETED", "FAILED", "REFUNDED"]).optional(),
        paymentMethod: z.string().optional(),
        transactionId: z.string().optional(),
    }).passthrough(),
});

export const AppointmentBookingValidation = {
    createAppointmentBookingSchema,
    updateAppointmentBookingSchema,
};
