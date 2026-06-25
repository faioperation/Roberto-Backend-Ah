import { envVars } from "../../config/env.js";
import { WhatsappService } from "./whatsapp.service.js";
import { handleWebhookEvent } from "./whatsapp.webhook.js";
import prisma from "../../prisma/client.js";
import { getBusinessAndBranchForUser } from "../../utils/workflowHelpers.js";

export const WhatsappController = {
  verifyWebhook: (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === envVars.WHATSAPP_VERIFY_TOKEN) {
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  },

  receiveWebhook: async (req, res) => {
    const body = req.body;
    try {
      await handleWebhookEvent(body);
      res.status(200).send("EVENT_RECEIVED");
    } catch (error) {
      console.error("Webhook processing error:", error);
      res.status(200).send("EVENT_RECEIVED"); // Always return 200 to Meta
    }
  },

  connectAccount: async (req, res) => {
    try {
      const { businessId } = await getBusinessAndBranchForUser(req.user);
      if (!businessId) return res.status(404).json({ success: false, message: "Business not found for this user" });
      
      const account = await WhatsappService.connectAccount(businessId, req.body);
      res.json({ success: true, data: account });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  checkConnectionStatus: async (req, res) => {
    try {
      const { businessId, branchId: userBranchId, isOwner } = await getBusinessAndBranchForUser(req.user);
      if (!businessId) return res.status(404).json({ success: false, message: "Business not found for this user" });
      
      const branchId = isOwner ? (req.query.branchId || null) : userBranchId;

      const whereClause = { businessId, status: "ACTIVE" };
      if (branchId) {
        whereClause.branchId = branchId;
      }

      const account = await prisma.whatsappAccount.findFirst({
        where: whereClause,
      });

      if (account) {
        const { accessToken, ...safeAccount } = account;
        res.json({ success: true, connected: true, data: safeAccount });
      } else {
        res.json({ success: true, connected: false });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getConversations: async (req, res) => {
    try {
      const { businessId, branchId: userBranchId, isOwner } = await getBusinessAndBranchForUser(req.user);
      if (!businessId) return res.status(404).json({ success: false, message: "Business not found for this user" });
      
      const branchId = isOwner ? (req.query.branchId || null) : userBranchId;
      const data = await WhatsappService.getConversations(businessId, branchId);
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getMessages: async (req, res) => {
    try {
      const { businessId } = await getBusinessAndBranchForUser(req.user);
      if (!businessId) return res.status(404).json({ success: false, message: "Business not found for this user" });
      
      const { id: conversationId } = req.params;
      const data = await WhatsappService.getMessages(businessId, conversationId);
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  sendTextMessage: async (req, res) => {
    try {
      const { businessId } = await getBusinessAndBranchForUser(req.user);
      if (!businessId) return res.status(404).json({ success: false, message: "Business not found for this user" });
      
      const { conversationId, message } = req.body;
      const data = await WhatsappService.sendTextMessage(businessId, conversationId, message);
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  sendMediaMessage: async (req, res) => {
    try {
      const { businessId } = await getBusinessAndBranchForUser(req.user);
      if (!businessId) return res.status(404).json({ success: false, message: "Business not found for this user" });
      
      const { conversationId, type } = req.body;
      
      let finalUrl = req.body.url;

      if (req.file) {
        // Construct the public URL using BACKEND_URL from env
        finalUrl = `${envVars.BACKEND_URL}/uploads/whatsapp/${req.file.filename}`;
      }

      if (!finalUrl) {
        return res.status(400).json({ success: false, message: "Either a 'file' (multipart/form-data) or a valid 'url' must be provided." });
      }

      const data = await WhatsappService.sendMediaMessage(businessId, conversationId, type, finalUrl);
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  disconnectAccount: async (req, res) => {
    try {
      const { businessId } = await getBusinessAndBranchForUser(req.user);
      if (!businessId) return res.status(404).json({ success: false, message: "Business not found for this user" });

      const { accountId } = req.body;
      if (!accountId) {
        return res.status(400).json({ success: false, message: "Account ID is required" });
      }

      await WhatsappService.disconnectAccount(businessId, accountId);
      res.json({ success: true, message: "WhatsApp account disconnected successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};
