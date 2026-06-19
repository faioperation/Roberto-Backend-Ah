import { z } from "zod";

const createWorkflowSchema = z.object({
    body: z.object({
        name: z.string({ required_error: "Workflow name is required" }),
        type: z.enum(["BOOKING", "CRM"]).optional(),
    }),
});

const createStageSchema = z.object({
    body: z.object({
        name: z.string({ required_error: "Stage name is required" }),
        order: z.number({ required_error: "Order index is required" }),
        color: z.string().optional(),
    }),
});

const reorderStagesSchema = z.object({
    body: z.object({
        stages: z.array(
            z.object({
                id: z.string({ required_error: "stageId is required" }),
                order: z.number({ required_error: "order index is required" }),
            })
        ),
    }),
});

export const WorkflowValidation = {
    createWorkflowSchema,
    createStageSchema,
    reorderStagesSchema,
};
