import { handleIncomingMessage } from "./instagram.service.js";

export const processWebhookEvent = async (body) => {
  if (body.object === "instagram" || body.object === "page") {
    for (const entry of body.entry) {
      // For instagram object, entry.id is the instagram account ID
      // If it comes via page, it might be the page ID or instagram account ID depending on webhook config
      const accountId = entry.id;

      // Ensure this is a messaging event
      if (!entry.messaging) continue;
      
      for (const webhookEvent of entry.messaging) {
        // Handle message event, ignore echos (messages sent by the business itself)
        if (webhookEvent.message && !webhookEvent.message.is_echo) {
          // Additional check: some instagram webhooks include a specific flag or different sender structure
          await handleIncomingMessage(accountId, webhookEvent);
        }
      }
    }
  }
};
