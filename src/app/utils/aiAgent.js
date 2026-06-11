import axios from "axios";
import prisma from "../prisma/client.js";
import { envVars } from "../config/env.js";

export const notifyAiAgent = async ({
  businessId,
  recipientId,
  conversationId,
  channel,
  message
}) => {
  try {
    const apiBaseUrl = envVars.AI_API_TAREQ;
    if (!apiBaseUrl) {
      console.warn("AI_API_TAREQ is not defined in environment variables.");
      return;
    }

    // Fetch business to get type (subject)
    const business = await prisma.business.findUnique({
      where: { id: businessId }
    });

    const payload = {
      business_id: businessId,
      subject: business?.businessType || "others",
      recipient_id: recipientId,
      conversation_id: conversationId,
      channel,
      message: message || ""
    };

    console.log(`[AI Agent] Triggering notifyAiAgent for channel ${channel}...`);
    console.log("[AI Agent] Payload:", JSON.stringify(payload, null, 2));

    const response = await axios.post(`${apiBaseUrl}/agent/message`, payload, {
      headers: {
        "x-api-token": envVars.AI_AGENT_API_TOKEN,
        "Content-Type": "application/json"
      }
    });

    console.log("[AI Agent] Response from AI API:", response.data);

    // If AI replied successfully, send it back to the customer
    const responseText = response.data?.response;
    if (responseText) {
      // Deduplication check: check if the response was already sent
      let alreadySent = false;
      try {
        const tenSecondsAgo = new Date(Date.now() - 10000);
        if (channel === "whatsapp") {
          const lastOutgoing = await prisma.whatsappMessage.findFirst({
            where: {
              conversationId,
              direction: "OUTGOING",
              createdAt: { gte: tenSecondsAgo }
            },
            orderBy: { createdAt: "desc" }
          });
          if (lastOutgoing && lastOutgoing.text?.trim() === responseText.trim()) {
            alreadySent = true;
          }
        } else if (channel === "instagram" || channel === "messenger") {
          const lastOutgoing = await prisma.message.findFirst({
            where: {
              conversationId,
              senderType: { in: ["agent", "business"] },
              createdAt: { gte: tenSecondsAgo }
            },
            orderBy: { createdAt: "desc" }
          });
          if (lastOutgoing && lastOutgoing.messageText?.trim() === responseText.trim()) {
            alreadySent = true;
          }
        }
      } catch (dbError) {
        console.error("[AI Agent] Error in deduplication check:", dbError);
      }

      if (alreadySent) {
        console.log(`[AI Agent] Reply was already sent to user on ${channel} (deduplicated). Skipping.`);
        return response.data;
      }

      console.log(`[AI Agent] Sending AI reply back to user on ${channel}: ${responseText}`);

      if (channel === "messenger") {
        const { sendMessageToUser } = await import("../modules/messenger/messenger.service.js");
        await sendMessageToUser(businessId, recipientId, responseText, "agent");
      } else if (channel === "instagram") {
        const { sendMessageToUser } = await import("../modules/instagram/instagram.service.js");
        await sendMessageToUser(businessId, recipientId, responseText, "agent");
      } else if (channel === "whatsapp") {
        const { WhatsappService } = await import("../modules/whatsapp/whatsapp.service.js");
        await WhatsappService.sendTextMessage(businessId, conversationId, responseText);
      }
    }

    return response.data;
  } catch (error) {
    console.error(
      "[AI Agent] Error in notifyAiAgent:",
      error.response?.data ? JSON.stringify(error.response.data, null, 2) : error.message
    );
  }
};
