import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/sendResponse.js";
import { ConversationOffService } from "./conversationOff.service.js";

const toggleConversationAi = async (req, res, next) => {
    try {
        const businessId = req.business.id;
        const { conversationId, action } = req.body;

        const result = await ConversationOffService.toggleConversationAiService(
            businessId,
            conversationId,
            action
        );

        sendResponse(res, {
            success: true,
            message: `AI Chatbot ${action === "pause" ? "paused" : "resumed"} successfully`,
            statusCode: StatusCodes.OK,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getConversationAiStatus = async (req, res, next) => {
    try {
        const businessId = req.business.id;
        const { conversationId } = req.params;

        const result = await ConversationOffService.getConversationAiStatusService(
            businessId,
            conversationId
        );

        sendResponse(res, {
            success: true,
            message: "AI Chatbot status retrieved successfully",
            statusCode: StatusCodes.OK,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const ConversationOffController = {
    toggleConversationAi,
    getConversationAiStatus,
};
