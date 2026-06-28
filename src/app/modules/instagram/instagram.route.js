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
  disconnectConnection,
} from "./instagram.controller.js";
import { checkAuthMiddleware } from "../../middleware/checkAuthMiddleware.js";
import { instagramUpload } from "./instagramUpload.js";

export const InstagramRoutes = Router();

// --- Public Routes (No Auth Needed) ---
// Instagram OAuth redirect
InstagramRoutes.get("/auth/instagram/callback", authFacebookCallback);

// Webhook Routes (Meta calls these directly)
InstagramRoutes.get("/webhook/instagram", verifyWebhook);
InstagramRoutes.post("/webhook/instagram", handleWebhookEvent);


// --- Protected API Routes ---
InstagramRoutes.use("/instagram", checkAuthMiddleware());

// OAuth Initialization
InstagramRoutes.get("/instagram/auth/facebook", authFacebook);

// Status
InstagramRoutes.get("/instagram/status", checkConnectionStatus);

// Send Message
InstagramRoutes.post("/instagram/messages/send", sendMessengerMessage);
InstagramRoutes.post(
  "/instagram/messages/media",
  instagramUpload.single("file"),
  sendMediaMessage
);

// Get Data
InstagramRoutes.get("/instagram/conversations", getConversations);
InstagramRoutes.get("/instagram/messages/:conversationId", getMessages);

InstagramRoutes.post("/instagram/disconnect", disconnectConnection);
