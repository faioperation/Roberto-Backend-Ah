import { z } from "zod";

const createCampaignSchema = z.object({
    body: z.object({
        title: z.string({ required_error: "Title is required" }),
        selectedPeople: z.union([
            z.enum(["COLD", "WARM", "BOOKED", "HOT"]),
            z.array(z.enum(["COLD", "WARM", "BOOKED", "HOT"]))
        ], { required_error: "selectedPeople is required" })
        .transform((val) => (Array.isArray(val) ? val : [val])),
        scheduledTime: z.string().optional(),
        scheduled_time: z.string().optional(),
        endDate: z.string().optional().nullable(),
        end_date: z.string().optional().nullable(),
        message: z.string({ required_error: "Message is required" }),
        branchId: z.string().uuid().optional().nullable(),
    }).refine(data => data.scheduledTime || data.scheduled_time, {
        message: "Scheduled time is required",
        path: ["scheduledTime"]
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
        scheduled_time: z.string().optional(),
        endDate: z.string().optional().nullable(),
        end_date: z.string().optional().nullable(),
        message: z.string().optional(),
        branchId: z.string().uuid().optional().nullable(),
    }),
});

export const CampaignValidation = {
    createCampaignSchema,
    updateCampaignSchema,
};
