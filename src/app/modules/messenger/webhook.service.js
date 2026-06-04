import { handleIncomingMessage } from "./messenger.service.js";

export const processWebhookEvent = async (body) => {
  if (body.object === "page") {
    for (const entry of body.entry) {
      const pageId = entry.id;

      // Ensure this is a messaging event
      if (!entry.messaging) continue;
      
      for (const webhookEvent of entry.messaging) {
        // Handle message event, ignore echos (messages sent by the page itself)
        if (webhookEvent.message && !webhookEvent.message.is_echo) {
          await handleIncomingMessage(pageId, webhookEvent);
        }
      }
    }
  }
};
