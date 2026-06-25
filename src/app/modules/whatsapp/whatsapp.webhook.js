import prisma from "../../prisma/client.js";
import { notifyAiAgent } from "../../utils/aiAgent.js";
import { NotificationService } from "../notification/notification.service.js";
import { isConversationLimitReached } from "../../utils/limitChecker.js";

export const handleWebhookEvent = async (body) => {
  if (body.object === "whatsapp_business_account") {
    for (const entry of body.entry) {
      for (const change of entry.changes) {
        if (change.value && change.value.messages) {
          await processIncomingMessages(change.value);
        }
        if (change.value && change.value.statuses) {
          await processMessageStatuses(change.value);
        }
      }
    }
  }
};

const processIncomingMessages = async (value) => {
  const phoneNumberId = value.metadata.phone_number_id;
  const contacts = value.contacts;
  const messages = value.messages;

  if (!contacts || !messages) return;

  // Find the WhatsApp Account by phone_number_id
  const account = await prisma.whatsappAccount.findFirst({
    where: { phoneNumberId, status: "ACTIVE" },
  });

  if (!account) return;

  const businessId = account.businessId;

  for (const contact of contacts) {
    const waUserId = contact.wa_id;
    const name = contact.profile?.name;
    const phoneNumber = waUserId;

    // Check if conversation already exists before checking limits
    const existingContact = await prisma.whatsappContact.findUnique({
      where: {
        businessId_waUserId: { businessId, waUserId },
      },
    });

    let existingConv = null;
    if (existingContact) {
      existingConv = await prisma.whatsappConversation.findUnique({
        where: {
          businessId_contactId: { businessId, contactId: existingContact.id },
        },
      });
    }

    if (!existingConv) {
      const limitReached = await isConversationLimitReached(businessId);
      if (limitReached) {
        console.warn(`[WhatsApp Webhook] Conversation limit reached for business: ${businessId}. Ignoring incoming message.`);
        continue;
      }
    }

    // Upsert Contact
    const dbContact = await prisma.whatsappContact.upsert({
      where: {
        businessId_waUserId: { businessId, waUserId },
      },
      update: {
        name: name || undefined,
        lastMessageAt: new Date(),
      },
      create: {
        businessId,
        whatsappAccountId: account.id,
        waUserId,
        phoneNumber,
        name,
        lastMessageAt: new Date(),
      },
    });

    // Upsert Conversation
    const conversation = await prisma.whatsappConversation.upsert({
      where: {
        businessId_contactId: { businessId, contactId: dbContact.id },
      },
      update: {
        unreadCount: { increment: 1 },
        lastMessageAt: new Date(),
      },
      create: {
        businessId,
        whatsappAccountId: account.id,
        contactId: dbContact.id,
        unreadCount: 1,
        lastMessageAt: new Date(),
      },
    });

    for (const message of messages) {
      const type = message.type;
      let text = null;
      let mediaUrl = null;

      if (type === "text") {
        text = message.text.body;
      } else if (["image", "video", "audio", "document", "sticker"].includes(type)) {
        const mediaObj = message[type];
        mediaUrl = mediaObj.id; // Store Media ID, to be fetched if necessary
      }

      await prisma.whatsappMessage.create({
        data: {
          businessId,
          whatsappAccountId: account.id,
          conversationId: conversation.id,
          contactId: dbContact.id,
          metaMessageId: message.id,
          direction: "INCOMING",
          type,
          text,
          mediaUrl,
          rawPayload: message,
          status: "DELIVERED",
        },
      });

      // Trigger notification for incoming WhatsApp message with throttling
      NotificationService.shouldSendMessageNotification(conversation.id, "whatsapp").then((shouldNotify) => {
        if (shouldNotify) {
          NotificationService.createAndSendNotification({
            title: "New WhatsApp Message",
            message: `Message: "${text || "Attachment/Other"}"`,
            type: "NEW_MESSAGE",
            businessId: businessId,
            branchId: account.branchId || null,
            conversationId: conversation.id,
          }).catch(err => console.error("Error sending WhatsApp incoming message notification:", err));
        }
      }).catch(err => console.error("Error checking WhatsApp throttling:", err));

      // Update conversation's last message ID
      await prisma.whatsappConversation.update({
        where: { id: conversation.id },
        data: { lastMessageId: message.id },
      });

      // Notify AI Agent of incoming WhatsApp message
      notifyAiAgent({
        businessId,
        recipientId: waUserId,
        conversationId: conversation.id,
        channel: "whatsapp",
        message: text || ""
      });
    }
  }
};

const processMessageStatuses = async (value) => {
  const statuses = value.statuses;
  if (!statuses) return;

  for (const status of statuses) {
    const messageId = status.id;
    const statusType = status.status; // 'sent', 'delivered', 'read', 'failed'

    const mappedStatus = statusType.toUpperCase();

    if (["SENT", "DELIVERED", "READ", "FAILED"].includes(mappedStatus)) {
      await prisma.whatsappMessage.updateMany({
        where: { metaMessageId: messageId },
        data: { status: mappedStatus },
      });
    }
  }
};
