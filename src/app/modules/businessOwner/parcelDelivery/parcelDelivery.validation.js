import { z } from "zod";

const createParcelDeliverySchema = z.object({
    body: z.object({
        customerName: z.string({ required_error: "Customer name is required" }),
        customerNumber: z.string({ required_error: "Customer number is required" }),
        email: z.string().email("Invalid email").optional().or(z.literal('')),
        price: z.union([z.string(), z.number()]).optional(),
        note: z.string().optional(),
        branchId: z.string().uuid("Invalid branch ID").optional(),

        // parcel details
        pickupAddress: z.string().optional(),
        deliveryDate: z.string().optional(),
        deliveryAddress: z.string().optional(),
        productType: z.string().optional(),
        productHeight: z.string().nullable().optional(),
        productWeight: z.union([z.string(), z.number()]).nullable().optional(),

        // payment
        paymentStatus: z.enum(["PENDING", "COMPLETED", "FAILED", "REFUNDED"]).optional(),
        paymentMethod: z.string().optional(),
        transactionId: z.string().optional(),
    }).passthrough(),
});

const updateParcelDeliverySchema = z.object({
    body: z.object({
        customerName: z.string().optional(),
        customerNumber: z.string().optional(),
        email: z.string().email("Invalid email").optional().or(z.literal('')),
        price: z.union([z.string(), z.number()]).optional(),
        note: z.string().optional(),
        branchId: z.string().uuid("Invalid branch ID").optional(),

        // parcel details
        pickupAddress: z.string().optional(),
        deliveryDate: z.string().optional(),
        deliveryAddress: z.string().optional(),
        productType: z.string().optional(),
        productHeight: z.string().nullable().optional(),
        productWeight: z.union([z.string(), z.number()]).nullable().optional(),

        // payment
        paymentStatus: z.enum(["PENDING", "COMPLETED", "FAILED", "REFUNDED"]).optional(),
        paymentMethod: z.string().optional(),
        transactionId: z.string().optional(),
    }).passthrough(),
});

export const ParcelDeliveryValidation = {
    createParcelDeliverySchema,
    updateParcelDeliverySchema,
};
