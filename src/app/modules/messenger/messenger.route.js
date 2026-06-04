import { Router } from "express";
import {
  authFacebook,
  authFacebookCallback,
  verifyWebhook,
  handleWebhookEvent,
  sendMessengerMessage,
  getConversations,
  getMessages,
  checkConnectionStatus,
  sendMediaMessage,
} from "./messenger.controller.js";
import { checkAuthMiddleware } from "../../middleware/checkAuthMiddleware.js";
import { messengerUpload } from "./messengerUpload.js";

export const MessengerRoutes = Router();

// --- Public Routes (No Auth Needed) ---
// Facebook redirects here directly from browser, so we handle it without JWT auth
MessengerRoutes.get("/auth/facebook/callback", authFacebookCallback);

// Webhook Routes (Meta calls these directly)
// Note: Kept as /webhook/facebook in case existing Meta apps are using it
MessengerRoutes.get("/webhook/facebook", verifyWebhook);
MessengerRoutes.post("/webhook/facebook", handleWebhookEvent);


// --- Protected API Routes ---
MessengerRoutes.use("/messenger", checkAuthMiddleware());

// OAuth Initialization
MessengerRoutes.get("/messenger/auth/facebook", authFacebook);

// Status
MessengerRoutes.get("/messenger/status", checkConnectionStatus);

// Send Message
MessengerRoutes.post("/messenger/messages/send", sendMessengerMessage);
MessengerRoutes.post(
  "/messenger/messages/media",
  messengerUpload.single("file"),
  sendMediaMessage
);

// Get Data
MessengerRoutes.get("/messenger/conversations", getConversations);
MessengerRoutes.get("/messenger/messages/:conversationId", getMessages);
