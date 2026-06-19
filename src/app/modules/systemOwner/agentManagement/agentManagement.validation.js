import { z } from "zod";

const createAgentSchema = z.object({
    body: z.object({
        businessId: z.string({
            required_error: "businessId is required",
        }),
        agentName: z.string({
            required_error: "agentName is required",
        }),
        branchId: z.string().optional(),
    }),
});

const updateAgentSchema = z.object({
    body: z.object({
        businessId: z.string().optional(),
        agentName: z.string().optional(),
        branchId: z.string().optional(),
    }),
});

export const AgentValidation = {
    createAgentSchema,
    updateAgentSchema,
};
