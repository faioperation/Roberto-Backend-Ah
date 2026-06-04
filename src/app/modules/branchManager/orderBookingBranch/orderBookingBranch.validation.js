import { z } from "zod";

const createOrderBookingSchema = z.object({
    body: z.object({
        customerName: z.string({ required_error: "Customer name is required" }),
        customerNumber: z.string({ required_error: "Customer number is required" }),
        email: z.string().email("Invalid email format").optional().or(z.literal('')),
        address: z.string({ required_error: "Address is required" }),
        deliveryFromAddress: z.string({ required_error: "Delivery from address is required" }),
        productName: z.string({ required_error: "Product name is required" }),
        quantity: z.string({ required_error: "Quantity is required" }),
        size: z.string({ required_error: "Size is required" }),
        price: z.string({ required_error: "Price is required" }),
        orderStatus: z.enum(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]).optional(),
        paymentStatus: z.enum(["PENDING", "COMPLETED", "FAILED", "REFUNDED"]).optional(),
        shippingCharge: z.string({ required_error: "Shipping charge is required" }),
        deliveryTime: z.string({ required_error: "Delivery time is required" }).transform((str) => new Date(str)),
        orderNote: z.string().optional(),
        paymentMethod: z.enum(["CASH_ON_DELIVERY", "ONLINE_PAYMENT", "BANK_TRANSFER"]).optional()
    })
});

const updateOrderBookingSchema = z.object({
    body: z.object({
        customerName: z.string().optional(),
        customerNumber: z.string().optional(),
        email: z.string().email("Invalid email format").optional().or(z.literal('')),
        address: z.string().optional(),
        deliveryFromAddress: z.string().optional(),
        productName: z.string().optional(),
        quantity: z.string().optional(),
        size: z.string().optional(),
        price: z.string().optional(),
        orderStatus: z.enum(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]).optional(),
        paymentStatus: z.enum(["PENDING", "COMPLETED", "FAILED", "REFUNDED"]).optional(),
        shippingCharge: z.string().optional(),
        deliveryTime: z.string().optional().transform((str) => (str ? new Date(str) : undefined)),
        orderNote: z.string().optional(),
        paymentMethod: z.enum(["CASH_ON_DELIVERY", "ONLINE_PAYMENT", "BANK_TRANSFER"]).optional()
    })
});

export const OrderBookingBranchValidation = {
    createOrderBookingSchema,
    updateOrderBookingSchema
};
