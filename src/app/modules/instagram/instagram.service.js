import axios from "axios";
import prisma from "../../prisma/client.js";
import { envVars } from "../../config/env.js";
import { AppError } from "../../errorHelper/appError.js";

const getGraphUrl = () => `https://graph.facebook.com/${envVars.META_GRAPH_VERSION || "v23.0"}`;

export const handleIncomingMessage = async (instagramAccountId, webhookEvent) => {
  const senderId = webhookEvent.sender.id;
  const messageText = webhookEvent.message?.text;
  const platformMessageId = webhookEvent.message?.mid;
  
  // Could be an image or other attachment
  const attachments = webhookEvent.message?.attachments;
  let lastMessageContent = messageText;
  if (!lastMessageContent && attachments && attachments.length > 0) {
      lastMessageContent = `[Media: ${attachments[0].type}]`;
  }
  if (!lastMessageContent) lastMessageContent = "Attachment/Other";

  // Find the social connection for this instagram account to identify the business
  const connection = await prisma.socialConnection.findFirst({
    where: { pageId: instagramAccountId, provider: "instagram", isActive: true },
  });

  if (!connection) {
    console.warn(`Received message for unconnected instagram account: ${instagramAccountId}`);
    return;
  }

  const businessId = connection.businessId;

  // Create or update conversation
  const conversation = await prisma.conversation.upsert({
    where: {
      businessId_platform_customerId: {
        businessId,
        platform: "instagram",
        customerId: senderId,
      },
    },
    update: {
      lastMessage: lastMessageContent,
      lastMessageAt: new Date(),
    },
    create: {
      businessId,
      platform: "instagram",
      customerId: senderId,
      lastMessage: lastMessageContent,
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
      type: attachments ? "media" : "text",
      mediaUrl: attachments ? attachments[0].payload?.url : null,
    },
  });
};

export const sendMessageToUser = async (businessId, recipientId, messageText, senderType = "business") => {
  // Get connection to find access token
  const connection = await prisma.socialConnection.findFirst({
    where: { businessId, provider: "instagram", isActive: true },
  });

  if (!connection) {
    throw new AppError(404, "No active Instagram connection found for this business.");
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
          platform: "instagram",
          customerId: recipientId,
        },
      },
    });

    if (conversation) {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderType: senderType,
          senderId: connection.pageId, // Sent by instagram account
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
    console.error("Error sending message via Instagram API:", error.response?.data || error.message);
    const metaError = error.response?.data?.error?.message || error.message;
    throw new AppError(500, `Instagram API Error: ${metaError}`);
  }
};

export const sendMediaMessageToUser = async (businessId, recipientId, type, mediaUrl, filePath) => {
  const connection = await prisma.socialConnection.findFirst({
    where: { businessId, provider: "instagram", isActive: true },
  });

  if (!connection) {
    throw new AppError(404, "No active Instagram connection found for this business.");
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
          platform: "instagram",
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
    console.error("Error sending media via Instagram API:", error.response?.data || error.message);
    const metaError = error.response?.data?.error?.message || error.message;
    throw new AppError(500, `Instagram API Error: ${metaError}`);
  }
};

export const getConversations = async (businessId) => {
  const conversations = await prisma.conversation.findMany({
    where: { businessId, platform: "instagram" },
    orderBy: { lastMessageAt: 'desc' },
  });
  return conversations;
};

export const getMessages = async (conversationId) => {
  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
  });
  return messages;
};
