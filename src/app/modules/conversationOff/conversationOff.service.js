import prisma from "../../prisma/client.js";
import { envVars } from "../../config/env.js";
import DevBuildError from "../../lib/DevBuildError.js";
import { StatusCodes } from "http-status-codes";
import axios from "axios";

const toggleConversationAiService = async (businessId, conversationId, action) => {
    // 1. Check in WhatsappConversation
    let recipientId = null;
    let whatsappConv = await prisma.whatsappConversation.findFirst({
        where: { id: conversationId, businessId },
    });

    if (whatsappConv) {
        const contact = await prisma.whatsappContact.findUnique({
            where: { id: whatsappConv.contactId },
        });

        if (contact) {
            recipientId = contact.waUserId;
        }

        // Update database status
        await prisma.whatsappConversation.update({
            where: { id: conversationId },
            data: { aiReply: action === "resume" },
        });
    } else {
        // 2. Check in regular Conversation (Messenger / Instagram)
        const regularConv = await prisma.conversation.findFirst({
            where: { id: conversationId, businessId },
        });

        if (regularConv) {
            recipientId = regularConv.customerId;

            // Update database status
            await prisma.conversation.update({
                where: { id: conversationId },
                data: { aiReply: action === "resume" },
            });
        }
    }

    // If neither conversation exists or couldn't resolve recipientId, throw error
    if (!recipientId) {
        throw new DevBuildError(
            "Conversation not found or recipient could not be resolved.",
            StatusCodes.NOT_FOUND
        );
    }

    // 3. Make HTTP request to Tareq's AI API (/agent/handoff)
    const apiBaseUrl = envVars.AI_API_TAREQ;
    if (!apiBaseUrl) {
        console.warn("[ConversationOff] AI_API_TAREQ is not defined in environment variables.");
        return { success: true, dbUpdatedOnly: true };
    }

    const payload = {
        business_id: businessId,
        recipient_id: recipientId,
        action: action, // "pause" or "resume"
    };

    console.log(`[ConversationOff] Triggering AI Handoff: ${action} for recipient ${recipientId}`);
    
    try {
        const response = await axios.post(`${apiBaseUrl}/agent/handoff`, payload, {
            headers: {
                "x-api-token": envVars.AI_AGENT_API_TOKEN,
                "Content-Type": "application/json",
            },
        });

        console.log("[ConversationOff] Response from AI Handoff API:", response.data);
        return { success: true, aiApiResponse: response.data };
    } catch (error) {
        console.error(
            "[ConversationOff] Error calling AI Handoff API:",
            error.response?.data ? JSON.stringify(error.response.data, null, 2) : error.message
        );
        throw new DevBuildError(
            `Failed to communicate with AI Agent: ${error.response?.data?.message || error.message}`,
            error.response?.status || StatusCodes.INTERNAL_SERVER_ERROR
        );
    }
};

const getConversationAiStatusService = async (businessId, conversationId) => {
    // 1. Check in WhatsappConversation
    const whatsappConv = await prisma.whatsappConversation.findFirst({
        where: { id: conversationId, businessId },
    });

    if (whatsappConv) {
        return {
            conversationId: whatsappConv.id,
            aiReply: whatsappConv.aiReply,
            platform: "whatsapp",
        };
    }

    // 2. Check in regular Conversation
    const regularConv = await prisma.conversation.findFirst({
        where: { id: conversationId, businessId },
    });

    if (regularConv) {
        return {
            conversationId: regularConv.id,
            aiReply: regularConv.aiReply,
            platform: regularConv.platform,
        };
    }

    throw new DevBuildError("Conversation not found", StatusCodes.NOT_FOUND);
};

export const ConversationOffService = {
    toggleConversationAiService,
    getConversationAiStatusService,
};
