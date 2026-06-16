import { z } from "zod";

const createOrderBookingSchema = z.object({
    body: z.object({
        customerName: z.string({ required_error: "Customer name is required" }),
        customerNumber: z.string({ required_error: "Customer number is required" }),
        email: z.string().email("Invalid email").optional().or(z.literal('')),
        price: z.union([z.string(), z.number()]).optional(),
        stageId: z.string().optional(),
        paymentStatus: z.enum(["PENDING", "COMPLETED", "FAILED", "REFUNDED"]).optional(),
        paymentMethod: z.enum(["CASH_ON_DELIVERY", "ONLINE_PAYMENT", "BANK_TRANSFER"]).optional(),
        orderNote: z.string().optional(),
        branchId: z.string().uuid("Invalid branch ID").optional(),
        metadata: z.record(z.string(), z.any()).optional(), // Dynamic JSON data
    }).passthrough(),
});

const updateOrderBookingSchema = z.object({
    body: z.object({
        customerName: z.string().optional(),
        customerNumber: z.string().optional(),
        email: z.string().email("Invalid email").optional().or(z.literal('')),
        price: z.union([z.string(), z.number()]).optional(),
        stageId: z.string().optional(),
        paymentStatus: z.enum(["PENDING", "COMPLETED", "FAILED", "REFUNDED"]).optional(),
        paymentMethod: z.enum(["CASH_ON_DELIVERY", "ONLINE_PAYMENT", "BANK_TRANSFER"]).optional(),
        orderNote: z.string().optional(),
        branchId: z.string().uuid("Invalid branch ID").optional(),
        metadata: z.record(z.string(), z.any()).optional(),
    }).passthrough(),
});

export const OrderBookingValidation = {
    createOrderBookingSchema,
    updateOrderBookingSchema,
};
