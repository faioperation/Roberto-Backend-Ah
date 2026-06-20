import { z } from "zod";

const createCampaignSchema = z.object({
    body: z.object({
        title: z.string({ required_error: "Title is required" }),
        selectedPeople: z.union([
            z.enum(["COLD", "WARM", "BOOKED", "HOT"]),
            z.array(z.enum(["COLD", "WARM", "BOOKED", "HOT"]))
        ], { required_error: "selectedPeople is required" })
        .transform((val) => (Array.isArray(val) ? val : [val])),
        scheduledTime: z.string({ required_error: "Scheduled time is required" }),
        endDate: z.string().optional().nullable(),
        message: z.string({ required_error: "Message is required" }),
        branchId: z.string().uuid().optional().nullable(),
    }),
});

const updateCampaignSchema = z.object({
    body: z.object({
        title: z.string().optional(),
        selectedPeople: z.union([
            z.enum(["COLD", "WARM", "BOOKED", "HOT"]),
            z.array(z.enum(["COLD", "WARM", "BOOKED", "HOT"]))
        ]).optional()
        .transform((val) => (val === undefined ? undefined : Array.isArray(val) ? val : [val])),
        scheduledTime: z.string().optional(),
        endDate: z.string().optional().nullable(),
        message: z.string().optional(),
        branchId: z.string().uuid().optional().nullable(),
    }),
});

export const CampaignValidation = {
    createCampaignSchema,
    updateCampaignSchema,
};
