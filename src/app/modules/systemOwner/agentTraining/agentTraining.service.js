import prisma from "../../../prisma/client.js";
import DevBuildError from "../../../lib/DevBuildError.js";
import { StatusCodes } from "http-status-codes";
import { QueryBuilder } from "../../../utils/QueryBuilder.js";

const createAgentTrainingService = async (payload) => {
    const result = await prisma.agentTraining.create({
        data: payload,
    });
    return result;
};

const getAllAgentTrainingsService = async (query = {}) => {
    const queryBuilder = new QueryBuilder(query)
        .search(["systemPrompt", "businessInformation", "productInformation", "policiesGuidelines", "faq", "businessId"])
        .filter()
        .sort("-createdAt")
        .paginate()
        .fields();

    const queryParams = queryBuilder.build();

    const result = await prisma.agentTraining.findMany(queryParams);
    const total = await prisma.agentTraining.count({ where: queryBuilder.where });

    return {
        meta: queryBuilder.getMeta(total),
        data: result,
    };
};

const getAgentTrainingByIdService = async (id, query = {}) => {
    const queryBuilder = new QueryBuilder(query).fields();
    const queryParams = queryBuilder.build();

    const findArgs = {
        where: { id },
    };

    if (queryParams.select) {
        findArgs.select = queryParams.select;
    }

    const result = await prisma.agentTraining.findUnique(findArgs);
    
    if (!result) {
        throw new DevBuildError("Agent training not found", StatusCodes.NOT_FOUND);
    }

    return result;
};

const updateAgentTrainingService = async (id, payload) => {
    const isExist = await prisma.agentTraining.findUnique({
        where: { id },
    });

    if (!isExist) {
        throw new DevBuildError("Agent training not found", StatusCodes.NOT_FOUND);
    }

    const result = await prisma.agentTraining.update({
        where: { id },
        data: payload,
    });
    return result;
};

const deleteAgentTrainingService = async (id) => {
    const isExist = await prisma.agentTraining.findUnique({
        where: { id },
    });

    if (!isExist) {
        throw new DevBuildError("Agent training not found", StatusCodes.NOT_FOUND);
    }

    const result = await prisma.agentTraining.delete({
        where: { id },
    });
    
    return result;
};

export const AgentTrainingService = {
    createAgentTrainingService,
    getAllAgentTrainingsService,
    getAgentTrainingByIdService,
    updateAgentTrainingService,
    deleteAgentTrainingService,
};
