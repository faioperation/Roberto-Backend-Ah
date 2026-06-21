import { z } from "zod";

const conversationOffSchema = z.object({
    body: z.object({
        conversationId: z.string({ required_error: "conversationId is required" }).uuid("Invalid conversationId format"),
        action: z.enum(["pause", "resume"], { required_error: "action must be either 'pause' or 'resume'" }),
    }),
});

export const ConversationOffValidation = {
    conversationOffSchema,
};
