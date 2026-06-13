import axios from "axios";
import prisma from "../../prisma/client.js";
import { envVars } from "../../config/env.js";
import { AppError } from "../../errorHelper/appError.js";
import { notifyAiAgent } from "../../utils/aiAgent.js";

const getGraphUrl = () => `https://graph.facebook.com/${envVars.META_GRAPH_VERSION || "v23.0"}`;

export const handleIncomingMessage = async (pageId, webhookEvent) => {
  const senderId = webhookEvent.sender.id;
  const messageText = webhookEvent.message.text;
  const platformMessageId = webhookEvent.message.mid;

  // Find the social connection for this page to identify the business
  const connection = await prisma.socialConnection.findFirst({
    where: { pageId, provider: "facebook", isActive: true },
  });

  if (!connection) {
    console.warn(`Received message for unconnected page: ${pageId}`);
    return;
  }

  const businessId = connection.businessId;

  // Create or update conversation
  const conversation = await prisma.conversation.upsert({
    where: {
      businessId_platform_customerId: {
        businessId,
        platform: "messenger",
        customerId: senderId,
      },
    },
    update: {
      lastMessage: messageText || "Attachment/Other",
      lastMessageAt: new Date(),
    },
    create: {
      businessId,
      platform: "messenger",
      customerId: senderId,
      lastMessage: messageText || "Attachment/Other",
      lastMessageAt: new Date(),
    },
  });

  // Save the message
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderType: "customer",
      senderId: senderId,
      messageText: messageText,
      platformMessageId: platformMessageId,
      rawPayload: webhookEvent,
    },
  });

  // Notify AI Agent of incoming Messenger message
  notifyAiAgent({
    businessId,
    recipientId: senderId,
    conversationId: conversation.id,
    channel: "messenger",
    message: messageText || ""
  });
};

export const sendMessageToUser = async (businessId, recipientId, messageText, senderType = "business") => {
  // Get connection to find page access token
  const connection = await prisma.socialConnection.findFirst({
    where: { businessId, provider: "facebook", isActive: true },
  });

  if (!connection) {
    throw new AppError(404, "No active Facebook page connection found for this business.");
  }

  const payload = {
    recipient: { id: recipientId },
    message: { text: messageText },
  };

  try {
    const response = await axios.post(
      `${getGraphUrl()}/me/messages`,
      payload,
      {
        params: {
          access_token: connection.accessToken,
        },
      }
    );

    // Save the outgoing message to Prisma
    const conversation = await prisma.conversation.findUnique({
      where: {
        businessId_platform_customerId: {
          businessId,
          platform: "messenger",
          customerId: recipientId,
        },
      },
    });

    if (conversation) {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderType: senderType,
          senderId: connection.pageId, // Sent by page
          messageText: messageText,
          platformMessageId: response.data.message_id,
          rawPayload: response.data,
        },
      });

      // Update last message
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessage: messageText,
          lastMessageAt: new Date(),
        },
      });
    }

    return response.data;
  } catch (error) {
    console.error("Error sending message via Messenger API:", error.response?.data || error.message);
    throw new AppError(500, "Failed to send message via Facebook Messenger API.");
  }
};

export const sendMediaMessageToUser = async (businessId, recipientId, type, mediaUrl, filePath) => {
  const connection = await prisma.socialConnection.findFirst({
    where: { businessId, provider: "facebook", isActive: true },
  });

  if (!connection) {
    throw new AppError(404, "No active Facebook page connection found for this business.");
  }

  // Messenger API type needs to be one of: image, video, audio, file
  let attachmentType = type;
  if (type === "document") attachmentType = "file";

  const payload = {
    recipient: { id: recipientId },
    message: {
      attachment: {
        type: attachmentType,
        payload: {
          url: mediaUrl,
          is_reusable: true
        }
      }
    }
  };

  try {
    const response = await axios.post(
      `${getGraphUrl()}/me/messages`,
      payload,
      { params: { access_token: connection.accessToken } }
    );

    const conversation = await prisma.conversation.findUnique({
      where: {
        businessId_platform_customerId: {
          businessId,
          platform: "messenger",
          customerId: recipientId,
        },
      },
    });

    if (conversation) {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderType: "business",
          senderId: connection.pageId,
          type: type,
          messageText: `[Media: ${attachmentType}]`,
          mediaUrl: mediaUrl,
          filePath: filePath,
          platformMessageId: response.data.message_id,
          rawPayload: response.data,
        },
      });

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessage: `[Media: ${attachmentType}]`,
          lastMessageAt: new Date(),
        },
      });
    }

    return response.data;
  } catch (error) {
    console.error("Error sending media via Messenger API:", error.response?.data || error.message);
    throw new AppError(500, "Failed to send media via Facebook Messenger API.");
  }
};

export const getConversations = async (businessId) => {
  const conversations = await prisma.conversation.findMany({
    where: { businessId, platform: "messenger" },
    orderBy: { lastMessageAt: 'desc' },
  });

  const conversationIds = conversations.map((c) => c.id);
  const summaries = await prisma.chatSummary.findMany({
    where: { conversationId: { in: conversationIds } },
  });

  return conversations.map((c) => {
    const summary = summaries.find((s) => s.conversationId === c.id);
    return {
      ...c,
      chatSummary: summary || null,
    };
  });
};

export const getMessages = async (conversationId) => {
  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
  });
  return messages;
};
