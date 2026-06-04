import { z } from "zod";

const createActivityLogSchema = z.object({
    body: z.object({
        activityName: z.string().optional(),
        activityTitle: z.string().optional(),
        activityType: z.string().optional(),
        markAsRead: z.boolean().optional(),
    }),
});

const updateActivityLogSchema = z.object({
    body: z.object({
        activityName: z.string().optional(),
        activityTitle: z.string().optional(),
        activityType: z.string().optional(),
        markAsRead: z.boolean().optional(),
    }),
});

export const ActivityLogValidation = {
    createActivityLogSchema,
    updateActivityLogSchema,
};
