import prisma from "../../../prisma/client.js";
import DevBuildError from "../../../lib/DevBuildError.js";
import { StatusCodes } from "http-status-codes";
import { QueryBuilder } from "../../../utils/QueryBuilder.js";
import { envVars } from "../../../config/env.js";
import { extractTextFromFile } from "../../../utils/textExtractor.js";
import axios from "axios";
import fs from "fs";
import path from "path";

/**
 * Helper to call the external voice agent creation API
 */
const callExternalCreateAgent = async (agentName, file) => {
    const apiBaseUrl = envVars.VOICE_AGENT_API;
    if (!apiBaseUrl) {
        throw new DevBuildError("VOICE_AGENT_API is not defined in environment variables", StatusCodes.INTERNAL_SERVER_ERROR);
    }

    try {
        const fileBuffer = fs.readFileSync(file.path);
        const blob = new Blob([fileBuffer], { type: file.mimetype });

        const formData = new FormData();
        formData.append("business_id", agentName);
        formData.append("rules_file", blob, file.originalname);

        console.log(`[Voice Agent API] Calling create endpoint at: ${apiBaseUrl}/api/agents/create`);
        const response = await axios.post(`${apiBaseUrl}/api/agents/create`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        console.log("[Voice Agent API] Create Response:", response.data);
        return response.data;
    } catch (error) {
        console.error(
            "[Voice Agent API] Error during agent creation:",
            error.response?.data ? JSON.stringify(error.response.data, null, 2) : error.message
        );
        throw new DevBuildError(
            error.response?.data?.message || error.response?.data?.detail || "Failed to create agent on external voice agent API",
            error.response?.status || StatusCodes.INTERNAL_SERVER_ERROR
        );
    }
};

/**
 * Helper to compile/merge multiple rules files into one
 */
const mergeRulesFiles = async (files) => {
    let combinedTextParts = [];
    for (const file of files) {
        const text = await extractTextFromFile(file.path, file.mimetype);
        if (text) {
            combinedTextParts.push(text);
        }
    }
    const combinedText = combinedTextParts.join("\n\n").trim();
    
    // Write combined text into a merged file in uploads/agents
    const uploadPath = path.join(process.cwd(), "uploads", "agents");
    if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
    }
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = `merged-rules-${uniqueSuffix}.txt`;
    const mergedFilePath = path.join(uploadPath, filename);
    
    fs.writeFileSync(mergedFilePath, combinedText, "utf-8");
    
    // Cleanup original uploaded files since they are merged
    for (const file of files) {
        fs.unlink(file.path, (err) => {
            if (err) console.error("[Service] Error deleting original file during merge:", err.message);
        });
    }

    return {
        path: mergedFilePath,
        filename,
        originalname: "merged-rules.txt",
        mimetype: "text/plain"
    };
};

const createAgentService = async (businessId, agentName, files, branchId) => {
    if (!files || files.length === 0) {
        throw new DevBuildError("rules_file is required for agent creation", StatusCodes.BAD_REQUEST);
    }

    let fileToUse;
    if (files.length === 1) {
        fileToUse = files[0];
    } else {
        fileToUse = await mergeRulesFiles(files);
    }

    // Call external Voice Agent API
    const externalResponse = await callExternalCreateAgent(agentName, fileToUse);
    const vapiId = externalResponse?.assistant_id || externalResponse?.id || externalResponse?.vapiId || externalResponse?.assistantId || null;

    const relativePath = `/uploads/agents/${fileToUse.filename}`;

    const result = await prisma.agent.create({
        data: {
            businessId,
            branchId: branchId || null,
            rulesFile: relativePath,
            vapiId,
            metadata: externalResponse ? { ...externalResponse, agentName } : { agentName },
        },
    });

    return result;
};

const getAllAgentsService = async (query = {}) => {
    const queryBuilder = new QueryBuilder(query)
        .search(["businessId", "vapiId"])
        .filter()
        .sort("-createdAt")
        .paginate()
        .fields();

    const queryParams = queryBuilder.build();

    const result = await prisma.agent.findMany(queryParams);
    const total = await prisma.agent.count({ where: queryBuilder.where });

    return {
        meta: queryBuilder.getMeta(total),
        data: result,
    };
};

const getAgentByIdService = async (id, query = {}) => {
    const queryBuilder = new QueryBuilder(query).fields();
    const queryParams = queryBuilder.build();

    const findArgs = {
        where: { id },
    };

    if (queryParams.select) {
        findArgs.select = queryParams.select;
    }

    const result = await prisma.agent.findUnique(findArgs);
    if (!result) {
        throw new DevBuildError("Agent not found", StatusCodes.NOT_FOUND);
    }

    return result;
};

const updateAgentService = async (id, payload, files) => {
    const existingAgent = await prisma.agent.findUnique({
        where: { id },
    });

    if (!existingAgent) {
        throw new DevBuildError("Agent not found", StatusCodes.NOT_FOUND);
    }

    const updateData = {};
    if (payload.businessId) {
        updateData.businessId = payload.businessId;
    }
    if (payload.branchId !== undefined) {
        updateData.branchId = payload.branchId;
    }

    const existingMetadata = existingAgent.metadata || {};
    let updatedMetadata = { ...existingMetadata };
    if (payload.agentName) {
        updatedMetadata.agentName = payload.agentName;
        updateData.metadata = updatedMetadata;
    }

    if (files && files.length > 0) {
        let fileToUse;
        if (files.length === 1) {
            fileToUse = files[0];
        } else {
            fileToUse = await mergeRulesFiles(files);
        }

        const agentNameForApi = payload.agentName || existingMetadata.agentName || "";
        const externalResponse = await callExternalCreateAgent(agentNameForApi, fileToUse);

        updateData.rulesFile = `/uploads/agents/${fileToUse.filename}`;
        updateData.vapiId = externalResponse?.assistant_id || externalResponse?.id || externalResponse?.vapiId || externalResponse?.assistantId || null;
        updateData.metadata = {
            ...updatedMetadata,
            ...(externalResponse || {}),
            agentName: agentNameForApi
        };

        // Optionally delete old local file to save storage
        if (existingAgent.rulesFile) {
            const oldPath = `.${existingAgent.rulesFile}`;
            fs.unlink(oldPath, (err) => {
                if (err) console.error("[Service] Error deleting old rules file:", err.message);
            });
        }
    }

    const result = await prisma.agent.update({
        where: { id },
        data: updateData,
    });

    return result;
};

const deleteAgentService = async (id) => {
    const existingAgent = await prisma.agent.findUnique({
        where: { id },
    });

    if (!existingAgent) {
        throw new DevBuildError("Agent not found", StatusCodes.NOT_FOUND);
    }

    // Delete local rules file
    if (existingAgent.rulesFile) {
        const filePath = `.${existingAgent.rulesFile}`;
        fs.unlink(filePath, (err) => {
            if (err) console.error("[Service] Error deleting rules file:", err.message);
        });
    }

    const result = await prisma.agent.delete({
        where: { id },
    });

    return result;
};

export const AgentService = {
    createAgentService,
    getAllAgentsService,
    getAgentByIdService,
    updateAgentService,
    deleteAgentService,
};
