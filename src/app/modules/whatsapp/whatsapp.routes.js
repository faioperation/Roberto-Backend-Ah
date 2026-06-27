import { Router } from "express";
import { WhatsappController } from "./whatsapp.controller.js";
import { checkAuthMiddleware } from "../../middleware/checkAuthMiddleware.js";
import validateRequest from "../../middleware/validateRequest.js";
import { WhatsappValidation } from "./whatsapp.validation.js";
import { whatsappUpload } from "./whatsappUpload.js";

export const WhatsappRoutes = Router();

// Public Webhooks (No auth needed, Meta will call these directly)
WhatsappRoutes.get("/webhooks/whatsapp", WhatsappController.verifyWebhook);
WhatsappRoutes.post("/webhooks/whatsapp", WhatsappController.receiveWebhook);
WhatsappRoutes.get("/auth/whatsapp/callback", WhatsappController.authWhatsAppCallback);

// Protected API Routes
// Uses the existing checkAuthMiddleware
WhatsappRoutes.use("/whatsapp", checkAuthMiddleware());

WhatsappRoutes.post(
  "/whatsapp/connect",
  validateRequest(WhatsappValidation.connectAccount),
  WhatsappController.connectAccount
);

WhatsappRoutes.get("/whatsapp/auth", WhatsappController.authWhatsApp);
WhatsappRoutes.get("/whatsapp/status", WhatsappController.checkConnectionStatus);

WhatsappRoutes.get("/whatsapp/conversations", WhatsappController.getConversations);
WhatsappRoutes.get("/whatsapp/conversations/:id/messages", WhatsappController.getMessages);

WhatsappRoutes.post(
  "/whatsapp/messages/send",
  validateRequest(WhatsappValidation.sendMessage),
  WhatsappController.sendTextMessage
);

WhatsappRoutes.post(
  "/whatsapp/messages/media",
  whatsappUpload.single("file"),
  validateRequest(WhatsappValidation.sendMediaMessage),
  WhatsappController.sendMediaMessage
);

WhatsappRoutes.post(
  "/whatsapp/disconnect",
  WhatsappController.disconnectAccount
);
