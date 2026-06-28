import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../../utils/sendResponse.js";
import { AgentTrainingService } from "./agentTraining.service.js";
import { envVars } from "../../../config/env.js";
import { extractTextFromFile } from "../../../utils/textExtractor.js";
import prisma from "../../../prisma/client.js";

const mapFiles = async (filesArray) => {
    if (!filesArray) return null;
    const result = [];
    for (const file of filesArray) {
        const filePath = `./uploads/agentTraining/${file.filename}`;
        const extractedText = await extractTextFromFile(filePath, file.mimetype);
        result.push({
            url: `${envVars.BACKEND_URL}/uploads/agentTraining/${file.filename}`,
            path: `/uploads/agentTraining/${file.filename}`,
            rowText: extractedText,
            mimetype: file.mimetype,
            originalname: file.originalname
        });
    }
    return result;
};

const sanitizePayload = (obj) => {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'string') {
        // Remove null bytes (\u0000 / \x00) and replace backslashes to prevent database driver Unicode escape crash
        return obj
            .replace(/\u0000/g, '')
            .replace(/\x00/g, '')
            .replace(/\\/g, '/');
    }
    if (Array.isArray(obj)) {
        return obj.map(sanitizePayload);
    }
    if (typeof obj === 'object') {
        const sanitized = {};
        for (const key of Object.keys(obj)) {
            sanitized[key] = sanitizePayload(obj[key]);
        }
        return sanitized;
    }
    return obj;
};

const compileRowText = (payload) => {
    let textParts = [];
    const extractFromJson = (jsonField) => {
        if (!jsonField) return;
        let files = [];
        try {
            files = typeof jsonField === 'string' ? JSON.parse(jsonField) : jsonField;
        } catch (e) {
            files = jsonField;
        }
        if (Array.isArray(files)) {
            files.forEach(file => {
                if (file.rowText) {
                    textParts.push(file.rowText);
                }
            });
        }
    };

    extractFromJson(payload.productInformation);
    extractFromJson(payload.policiesGuidelines);
    extractFromJson(payload.faq);

    return textParts.join("\n\n").trim();
};

const createAgentTraining = async (req, res, next) => {
    try {
        const payload = req.body;

        if (req.files) {
            if (req.files.productInformation) {
                payload.productInformation = await mapFiles(req.files.productInformation);
            }
            if (req.files.policiesGuidelines) {
                payload.policiesGuidelines = await mapFiles(req.files.policiesGuidelines);
            }
            if (req.files.faq) {
                payload.faq = await mapFiles(req.files.faq);
            }
        }
        
        payload.rowText = compileRowText(payload);
        
        const sanitizedPayload = sanitizePayload(payload);
        const result = await AgentTrainingService.createAgentTrainingService(sanitizedPayload);

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
                payload.productInformation = await mapFiles(req.files.productInformation);
            }
            if (req.files.policiesGuidelines) {
                payload.policiesGuidelines = await mapFiles(req.files.policiesGuidelines);
            }
            if (req.files.faq) {
                payload.faq = await mapFiles(req.files.faq);
            }
        }

        // Fetch existing to compile complete rowText
        const existing = await prisma.agentTraining.findUnique({
            where: { id }
        });
        if (existing) {
            const mergedPayload = {
                productInformation: payload.productInformation !== undefined ? payload.productInformation : existing.productInformation,
                policiesGuidelines: payload.policiesGuidelines !== undefined ? payload.policiesGuidelines : existing.policiesGuidelines,
                faq: payload.faq !== undefined ? payload.faq : existing.faq
            };
            payload.rowText = compileRowText(mergedPayload);
        }

        const sanitizedPayload = sanitizePayload(payload);
        const result = await AgentTrainingService.updateAgentTrainingService(id, sanitizedPayload);

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
