import prisma from "../../prisma/client.js";
import { envVars } from "../../config/env.js";
import DevBuildError from "../../lib/DevBuildError.js";
import { StatusCodes } from "http-status-codes";
import axios from "axios";

const toggleConversationAiService = async (businessId, conversationId, action) => {
    // 1. Check in WhatsappConversation
    let conversationFound = false;
    let whatsappConv = await prisma.whatsappConversation.findFirst({
        where: { id: conversationId, businessId },
    });

    if (whatsappConv) {
        conversationFound = true;
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
            conversationFound = true;
            // Update database status
            await prisma.conversation.update({
                where: { id: conversationId },
                data: { aiReply: action === "resume" },
            });
        }
    }

    // If neither conversation exists, throw error
    if (!conversationFound) {
        throw new DevBuildError(
            "Conversation not found.",
            StatusCodes.NOT_FOUND
        );
    }

    return { success: true };
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
