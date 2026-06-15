import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../../utils/sendResponse.js";
import { AgentService } from "./agentManagement.service.js";
import { envVars } from "../../../config/env.js";

const formatAgentResponse = (agent) => {
    if (!agent) return null;
    return {
        ...agent,
        rulesFile: agent.rulesFile ? `${envVars.BACKEND_URL}${agent.rulesFile}` : null
    };
};

const createAgent = async (req, res, next) => {
    try {
        const { businessId, agentName } = req.body;
        const files = req.files; // Array of files from multer

        const result = await AgentService.createAgentService(businessId, agentName, files);

        sendResponse(res, {
            success: true,
            message: "Agent created successfully",
            statusCode: StatusCodes.CREATED,
            data: formatAgentResponse(result),
        });
    } catch (error) {
        next(error);
    }
};

const getAllAgents = async (req, res, next) => {
    try {
        const result = await AgentService.getAllAgentsService(req.query);

        sendResponse(res, {
            success: true,
            message: "Agents retrieved successfully",
            statusCode: StatusCodes.OK,
            data: result.data.map(formatAgentResponse),
            meta: result.meta,
        });
    } catch (error) {
        next(error);
    }
};

const getAgentById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await AgentService.getAgentByIdService(id, req.query);

        sendResponse(res, {
            success: true,
            message: "Agent retrieved successfully",
            statusCode: StatusCodes.OK,
            data: formatAgentResponse(result),
        });
    } catch (error) {
        next(error);
    }
};

const updateAgent = async (req, res, next) => {
    try {
        const { id } = req.params;
        const payload = req.body;
        const files = req.files; // Array of files from multer

        const result = await AgentService.updateAgentService(id, payload, files);

        sendResponse(res, {
            success: true,
            message: "Agent updated successfully",
            statusCode: StatusCodes.OK,
            data: formatAgentResponse(result),
        });
    } catch (error) {
        next(error);
    }
};

const deleteAgent = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await AgentService.deleteAgentService(id);

        sendResponse(res, {
            success: true,
            message: "Agent deleted successfully",
            statusCode: StatusCodes.OK,
            data: formatAgentResponse(result),
        });
    } catch (error) {
        next(error);
    }
};

export const AgentController = {
    createAgent,
    getAllAgents,
    getAgentById,
    updateAgent,
    deleteAgent,
};
