import prisma from "../../../prisma/client.js";
import DevBuildError from "../../../lib/DevBuildError.js";
import { StatusCodes } from "http-status-codes";

const createWorkflowService = async (businessId, payload) => {
    const { name, type } = payload;
    const result = await prisma.workflow.create({
        data: {
            businessId,
            name,
            type: type || "BOOKING",
        },
        include: {
            stages: true
        }
    });
    return result;
};

const getWorkflowsService = async (businessId) => {
    const result = await prisma.workflow.findMany({
        where: { businessId },
        include: {
            stages: {
                orderBy: { order: "asc" }
            }
        }
    });
    return result;
};

const createStageService = async (workflowId, payload) => {
    const { name, order, color } = payload;

    // Check if workflow exists
    const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId }
    });
    if (!workflow) {
        throw new DevBuildError("Workflow not found", StatusCodes.NOT_FOUND);
    }

    const result = await prisma.workflowStage.create({
        data: {
            workflowId,
            name,
            order,
            color: color || null,
        }
    });
    return result;
};

const reorderStagesService = async (stagesList) => {
    const result = await prisma.$transaction(
        stagesList.map((stage) =>
            prisma.workflowStage.update({
                where: { id: stage.id },
                data: { order: stage.order }
            })
        )
    );
    return result;
};

export const WorkflowService = {
    createWorkflowService,
    getWorkflowsService,
    createStageService,
    reorderStagesService,
};
