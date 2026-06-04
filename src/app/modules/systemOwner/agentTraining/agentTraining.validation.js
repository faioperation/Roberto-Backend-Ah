import { z } from "zod";

const createAgentTrainingSchema = z.object({
    body: z.object({
        systemPrompt: z.string().optional(),
        businessInformation: z.string().optional(),
        productInformation: z.any().optional(),
        policiesGuidelines: z.any().optional(),
        faq: z.any().optional(),
        businessId: z.string({
            required_error: "businessId is required",
        }),
    }),
});

const updateAgentTrainingSchema = z.object({
    body: z.object({
        systemPrompt: z.string().optional(),
        businessInformation: z.string().optional(),
        productInformation: z.any().optional(),
        policiesGuidelines: z.any().optional(),
        faq: z.any().optional(),
        businessId: z.string().optional(),
    }),
});

export const AgentTrainingValidation = {
    createAgentTrainingSchema,
    updateAgentTrainingSchema,
};
