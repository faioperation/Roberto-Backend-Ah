import { z } from "zod";

const createAgentSchema = z.object({
    body: z.object({
        businessId: z.string({
            required_error: "businessId is required",
        }),
        agentName: z.string({
            required_error: "agentName is required",
        }),
    }),
});

const updateAgentSchema = z.object({
    body: z.object({
        businessId: z.string().optional(),
        agentName: z.string().optional(),
    }),
});

export const AgentValidation = {
    createAgentSchema,
    updateAgentSchema,
};
