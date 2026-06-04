import prisma from "../../prisma/client.js";
import { MetaGraphAPI } from "./whatsapp.meta.js";

export const WhatsappService = {
  connectAccount: async (businessId, payload) => {
    return await prisma.whatsappAccount.upsert({
      where: {
        businessId_phoneNumberId: {
          businessId,
          phoneNumberId: payload.phoneNumberId,
        },
      },
      update: {
        wabaId: payload.wabaId,
        phoneNumber: payload.phoneNumber,
        accessToken: payload.accessToken,
        status: "ACTIVE",
      },
      create: {
        businessId,
        wabaId: payload.wabaId,
        phoneNumberId: payload.phoneNumberId,
        phoneNumber: payload.phoneNumber,
        accessToken: payload.accessToken,
        status: "ACTIVE",
      },
    });
  },

  disconnectAccount: async (businessId, accountId) => {
    return await prisma.whatsappAccount.updateMany({
      where: { id: accountId, businessId },
      data: { status: "DISCONNECTED" },
    });
  },

  getAccounts: async (businessId) => {
    return await prisma.whatsappAccount.findMany({
      where: { businessId },
    });
  },

  getContacts: async (businessId) => {
    return await prisma.whatsappContact.findMany({
      where: { businessId },
    });
  },

  getConversations: async (businessId) => {
    return await prisma.whatsappConversation.findMany({
      where: { businessId },
      include: { contact: true },
    });
  },

  getMessages: async (businessId, conversationId) => {
    return await prisma.whatsappMessage.findMany({
      where: { businessId, conversationId },
      orderBy: { createdAt: "asc" },
    });
  },

  sendTextMessage: async (businessId, conversationId, messageText) => {
    const conversation = await prisma.whatsappConversation.findUnique({
      where: { id: conversationId },
      include: { contact: true, whatsappAccount: true },
    });

    if (!conversation) throw new Error("Conversation not found");

    const account = conversation.whatsappAccount;
    const contact = conversation.contact;

    const response = await MetaGraphAPI.sendMessage(
      account.phoneNumberId,
      account.accessToken,
      contact.phoneNumber,
      messageText
    );

    const message = await prisma.whatsappMessage.create({
      data: {
        businessId,
        whatsappAccountId: account.id,
        conversationId,
        contactId: contact.id,
        metaMessageId: response.messages?.[0]?.id,
        direction: "OUTGOING",
        type: "text",
        text: messageText,
        status: "SENT",
      },
    });

    await prisma.whatsappConversation.update({
      where: { id: conversationId },
      data: { lastMessageId: message.id, lastMessageAt: new Date() },
    });

    return message;
  },

  sendMediaMessage: async (businessId, conversationId, type, mediaUrl) => {
    const conversation = await prisma.whatsappConversation.findUnique({
      where: { id: conversationId },
      include: { contact: true, whatsappAccount: true },
    });

    if (!conversation) throw new Error("Conversation not found");

    const account = conversation.whatsappAccount;
    const contact = conversation.contact;

    const response = await MetaGraphAPI.sendMedia(
      account.phoneNumberId,
      account.accessToken,
      contact.phoneNumber,
      type,
      mediaUrl
    );

    const message = await prisma.whatsappMessage.create({
      data: {
        businessId,
        whatsappAccountId: account.id,
        conversationId,
        contactId: contact.id,
        metaMessageId: response.messages?.[0]?.id,
        direction: "OUTGOING",
        type: type,
        mediaUrl: mediaUrl,
        status: "SENT",
      },
    });

    await prisma.whatsappConversation.update({
      where: { id: conversationId },
      data: { lastMessageId: message.id, lastMessageAt: new Date() },
    });

    return message;
  },

  markConversationAsRead: async (businessId, conversationId) => {
    const messages = await prisma.whatsappMessage.findMany({
      where: {
        businessId,
        conversationId,
        direction: "INCOMING",
        status: "DELIVERED",
      },
    });

    if (messages.length === 0) return;

    const conversation = await prisma.whatsappConversation.findUnique({
      where: { id: conversationId },
      include: { whatsappAccount: true },
    });

    for (const msg of messages) {
      if (msg.metaMessageId) {
        try {
          await MetaGraphAPI.markAsRead(
            conversation.whatsappAccount.phoneNumberId,
            conversation.whatsappAccount.accessToken,
            msg.metaMessageId
          );
        } catch (e) {
          console.error("Error marking message as read:", e);
        }
      }
    }

    await prisma.whatsappConversation.update({
      where: { id: conversationId },
      data: { unreadCount: 0 },
    });
  },
};
