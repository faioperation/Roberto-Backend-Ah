import prisma from "../../prisma/client.js";

export const AllConversationsService = {
  getAllConversations: async (businessId, branchId) => {
    // 1. Fetch Messenger & Instagram Conversations
    const convWhereClause = { businessId };
    if (branchId) {
      convWhereClause.branchId = branchId;
    }

    const standardConversations = await prisma.conversation.findMany({
      where: convWhereClause,
      orderBy: { lastMessageAt: "desc" },
    });

    // 2. Fetch WhatsApp Conversations
    const waWhereClause = { businessId };
    if (branchId) {
      waWhereClause.whatsappAccount = { branchId };
    }

    const whatsappConversations = await prisma.whatsappConversation.findMany({
      where: waWhereClause,
      include: {
        contact: true,
        whatsappAccount: true,
      },
      orderBy: { lastMessageAt: "desc" },
    });

    // 3. Fetch Chat Summaries for all conversations
    const allConversationIds = [
      ...standardConversations.map((c) => c.id),
      ...whatsappConversations.map((c) => c.id),
    ];

    const summaries = await prisma.chatSummary.findMany({
      where: { conversationId: { in: allConversationIds } },
    });

    // 4. Resolve the text of the last WhatsApp messages
    const waLastMessageIds = whatsappConversations
      .map((c) => c.lastMessageId)
      .filter(Boolean);

    const waMessages = waLastMessageIds.length > 0
      ? await prisma.whatsappMessage.findMany({
          where: { id: { in: waLastMessageIds } },
        })
      : [];

    // 5. Map standard conversations (Messenger / Instagram)
    const unifiedStandard = standardConversations.map((c) => {
      const summary = summaries.find((s) => s.conversationId === c.id);
      return {
        id: c.id,
        businessId: c.businessId,
        branchId: c.branchId,
        platform: c.platform, // 'messenger' or 'instagram'
        customerId: c.customerId,
        customerName: c.customerName || "Social Customer",
        customerPhone: null,
        lastMessage: c.lastMessage,
        lastMessageAt: c.lastMessageAt,
        unreadCount: 0, // Standard conversations don't track unreadCount in DB explicitly
        aiReply: c.aiReply,
        chatSummary: summary || null,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      };
    });

    // 6. Map WhatsApp conversations
    const unifiedWhatsapp = whatsappConversations.map((c) => {
      const summary = summaries.find((s) => s.conversationId === c.id);
      const waMsg = waMessages.find((m) => m.id === c.lastMessageId);

      let lastMessageText = null;
      if (waMsg) {
        if (waMsg.type === "text") {
          lastMessageText = waMsg.text;
        } else {
          lastMessageText = `[Media: ${waMsg.type}]`;
        }
      }

      return {
        id: c.id,
        businessId: c.businessId,
        branchId: c.whatsappAccount?.branchId || null,
        platform: "whatsapp",
        customerId: c.contactId,
        customerName: c.contact?.name || "WhatsApp User",
        customerPhone: c.contact?.phoneNumber || null,
        lastMessage: lastMessageText,
        lastMessageAt: c.lastMessageAt,
        unreadCount: c.unreadCount || 0,
        aiReply: c.aiReply,
        chatSummary: summary || null,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      };
    });

    // 7. Combine & Sort
    const allConversations = [...unifiedStandard, ...unifiedWhatsapp];
    allConversations.sort((a, b) => {
      const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return dateB - dateA;
    });

    return allConversations;
  },
};
