import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../../utils/sendResponse.js";
import { AgentTrainingService } from "./agentTraining.service.js";
import { envVars } from "../../../config/env.js";

const mapFiles = (filesArray) => {
    if (!filesArray) return null;
    return filesArray.map(file => ({
        url: `${envVars.BACKEND_URL}/uploads/agentTraining/${file.filename}`,
        path: `/uploads/agentTraining/${file.filename}`,
        mimetype: file.mimetype,
        originalname: file.originalname
    }));
};

const createAgentTraining = async (req, res, next) => {
    try {
        const payload = req.body;

        if (req.files) {
            if (req.files.productInformation) {
                payload.productInformation = mapFiles(req.files.productInformation);
            }
            if (req.files.policiesGuidelines) {
                payload.policiesGuidelines = mapFiles(req.files.policiesGuidelines);
            }
            if (req.files.faq) {
                payload.faq = mapFiles(req.files.faq);
            }
        }
        
        const result = await AgentTrainingService.createAgentTrainingService(payload);

        sendResponse(res, {
            success: true,
            message: "Agent training created successfully",
            statusCode: StatusCodes.CREATED,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getAllAgentTrainings = async (req, res, next) => {
    try {
        const result = await AgentTrainingService.getAllAgentTrainingsService(req.query);

        sendResponse(res, {
            success: true,
            message: "Agent trainings retrieved successfully",
            statusCode: StatusCodes.OK,
            data: result.data,
            meta: result.meta,
        });
    } catch (error) {
        next(error);
    }
};

const getAgentTrainingById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await AgentTrainingService.getAgentTrainingByIdService(id, req.query);

        sendResponse(res, {
            success: true,
            message: "Agent training retrieved successfully",
            statusCode: StatusCodes.OK,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const updateAgentTraining = async (req, res, next) => {
    try {
        const { id } = req.params;
        const payload = req.body;

        if (req.files) {
            if (req.files.productInformation) {
                payload.productInformation = mapFiles(req.files.productInformation);
            }
            if (req.files.policiesGuidelines) {
                payload.policiesGuidelines = mapFiles(req.files.policiesGuidelines);
            }
            if (req.files.faq) {
                payload.faq = mapFiles(req.files.faq);
            }
        }

        const result = await AgentTrainingService.updateAgentTrainingService(id, payload);

        sendResponse(res, {
            success: true,
            message: "Agent training updated successfully",
            statusCode: StatusCodes.OK,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const deleteAgentTraining = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await AgentTrainingService.deleteAgentTrainingService(id);

        sendResponse(res, {
            success: true,
            message: "Agent training deleted successfully",
            statusCode: StatusCodes.OK,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const AgentTrainingController = {
    createAgentTraining,
    getAllAgentTrainings,
    getAgentTrainingById,
    updateAgentTraining,
    deleteAgentTraining,
};
