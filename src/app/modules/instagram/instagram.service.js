import axios from "axios";
import prisma from "../../prisma/client.js";
import { envVars } from "../../config/env.js";
import { AppError } from "../../errorHelper/appError.js";
import { notifyAiAgent } from "../../utils/aiAgent.js";
import { NotificationService } from "../notification/notification.service.js";

const getGraphUrl = () => `https://graph.facebook.com/${envVars.META_GRAPH_VERSION || "v23.0"}`;

const getInstagramUserProfile = async (igsid, pageAccessToken) => {
  try {
    const response = await axios.get(
      `${getGraphUrl()}/me/conversations`,
      {
        params: {
          platform: "instagram",
          user_id: igsid,
          fields: "participants",
          access_token: pageAccessToken,
        },
      }
    );
    const conversations = response.data?.data;
    if (conversations && conversations.length > 0) {
      const participants = conversations[0].participants?.data;
      if (participants) {
        const customer = participants.find((p) => p.id === igsid);
        if (customer && customer.name) {
          return { name: customer.name };
        }
      }
    }
    return { name: "Instagram User" };
  } catch (error) {
    console.error("Error fetching Instagram user profile from conversations:", error.response?.data || error.message);
    return { name: "Instagram User" };
  }
};

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

  // Fetch customerName if conversation doesn't exist or is missing name
  const existingConv = await prisma.conversation.findUnique({
    where: {
      businessId_platform_customerId: {
        businessId,
        platform: "instagram",
        customerId: senderId,
      },
    },
  });

  let customerName = existingConv?.customerName;
  if (!customerName || customerName === "Instagram User") {
    const profile = await getInstagramUserProfile(senderId, connection.accessToken);
    customerName = profile.name;
  }

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
      branchId: connection.branchId || null,
      customerName: customerName || undefined,
    },
    create: {
      businessId,
      branchId: connection.branchId || null,
      platform: "instagram",
      customerId: senderId,
      customerName: customerName || "Instagram User",
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

  // Trigger notification for incoming Instagram message with throttling
  NotificationService.shouldSendMessageNotification(conversation.id, "instagram").then((shouldNotify) => {
    if (shouldNotify) {
      NotificationService.createAndSendNotification({
        title: "New Instagram Message",
        message: `Message: "${messageText || "Attachment/Other"}"`,
        type: "NEW_MESSAGE",
        businessId: businessId,
        branchId: connection.branchId || null,
        conversationId: conversation.id,
      }).catch(err => console.error("Error sending Instagram incoming message notification:", err));
    }
  }).catch(err => console.error("Error checking Instagram throttling:", err));

  // Notify AI Agent of incoming Instagram message
  notifyAiAgent({
    businessId,
    recipientId: senderId,
    conversationId: conversation.id,
    channel: "instagram",
    message: messageText || ""
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

export const getConversations = async (businessId, branchId) => {
  const whereClause = { businessId, platform: "instagram" };
  if (branchId) {
    whereClause.branchId = branchId;
  }

  const conversations = await prisma.conversation.findMany({
    where: whereClause,
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
