import axios from "axios";
import prisma from "../../prisma/client.js";
import { envVars } from "../../config/env.js";
import { getLongLivedToken, getPageTokens, subscribeAppToPage } from "./facebook.service.js";
import { processWebhookEvent } from "./webhook.service.js";
import { sendMessageToUser, sendMediaMessageToUser, getConversations as getConversationsService, getMessages as getMessagesService } from "./instagram.service.js";
import { sendResponse } from "../../utils/sendResponse.js";
import { AppError } from "../../errorHelper/appError.js";
import { getBusinessAndBranchForUser } from "../../utils/workflowHelpers.js";

// --- OAuth ---
export const authFacebook = async (req, res, next) => {
  try {
    const business = await prisma.business.findFirst({ where: { ownerId: req.user.id } });
    if (!business) {
      throw new AppError(404, "Business not found for this user");
    }
    const businessId = business.id;
    const branchId = req.query.branchId || null;

    const redirectUri = envVars.INSTAGRAM_REDIRECT_URI;
    const appId = envVars.META_APP_ID;
    // Scopes needed for Instagram Messaging
    const permissions = "instagram_basic,instagram_manage_messages,pages_show_list,pages_manage_metadata,business_management";
    
    // Using state to pass businessId and branchId to callback
    const state = JSON.stringify({ businessId, branchId });
    const graphVersion = envVars.META_GRAPH_VERSION || "v23.0";

    const authUrl = `https://www.facebook.com/${graphVersion}/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${permissions}&state=${encodeURIComponent(state)}`;

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Instagram OAuth URL generated successfully.",
      data: { url: authUrl },
    });
  } catch (error) {
    next(error);
  }
};

export const authFacebookCallback = async (req, res, next) => {
  try {
    const { code, state, error, error_description } = req.query;

    if (error) {
      throw new AppError(400, `Instagram OAuth Error: ${error_description}`);
    }

    if (!code || !state) {
      throw new AppError(400, "Missing code or state from Instagram OAuth");
    }

    const parsedState = JSON.parse(state);
    const businessId = parsedState.businessId;
    const branchId = parsedState.branchId || null;
    const redirectUri = envVars.INSTAGRAM_REDIRECT_URI;
    const graphVersion = envVars.META_GRAPH_VERSION || "v23.0";

    // 1. Exchange authorization code for short-lived access token
    const tokenResponse = await axios.get(`https://graph.facebook.com/${graphVersion}/oauth/access_token`, {
      params: {
        client_id: envVars.META_APP_ID,
        redirect_uri: redirectUri,
        client_secret: envVars.META_APP_SECRET,
        code,
      },
    });

    const shortLivedToken = tokenResponse.data.access_token;

    // 2. Exchange for long-lived token
    const longLivedToken = await getLongLivedToken(shortLivedToken);

    // 3. Fetch pages and their linked instagram accounts
    const pages = await getPageTokens(longLivedToken);
    
    const connectedInstagramAccounts = [];

    // 4. Save Instagram accounts in database and subscribe to webhooks
    for (const page of pages) {
      if (page.instagram_business_account) {
        const igAccountId = page.instagram_business_account.id;
        
        // Check if connection exists
        const connection = await prisma.socialConnection.findFirst({
          where: { businessId, pageId: igAccountId, provider: "instagram" },
        });

        if (connection) {
          // Update existing connection
          await prisma.socialConnection.update({
            where: { id: connection.id },
            data: {
              accessToken: page.access_token, // We use the Facebook Page Token to interact with IG Graph API
              pageName: page.name + " (Instagram)",
              isActive: true,
              branchId: branchId || undefined,
            },
          });
        } else {
          // Create new connection
          await prisma.socialConnection.create({
            data: {
              businessId,
              branchId,
              provider: "instagram",
              pageId: igAccountId,
              pageName: page.name + " (Instagram)",
              accessToken: page.access_token,
            },
          });
        }
        
        connectedInstagramAccounts.push({ id: igAccountId, name: page.name + " (Instagram)" });

        // Automatically subscribe app to page webhook (which handles IG webhooks)
        await subscribeAppToPage(page.id, page.access_token);
      }
    }

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Instagram accounts connected successfully.",
      data: { accounts: connectedInstagramAccounts },
    });
  } catch (error) {
    next(error);
  }
};

// --- Webhooks ---
export const verifyWebhook = (req, res, next) => {
  try {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode && token) {
      // Use INSTAGRAM_VERIFY_TOKEN if set, otherwise fallback to FACEBOOK_VERIFY_TOKEN
      const verifyToken = envVars.INSTAGRAM_VERIFY_TOKEN || envVars.FACEBOOK_VERIFY_TOKEN;
      if (mode === "subscribe" && token === verifyToken) {
        console.log("INSTAGRAM_WEBHOOK_VERIFIED");
        return res.status(200).send(challenge);
      } else {
        return res.sendStatus(403);
      }
    }
    return res.sendStatus(400);
  } catch (error) {
    next(error);
  }
};

export const handleWebhookEvent = async (req, res, next) => {
  try {
    const body = req.body;
    console.log("📥 Received Instagram Webhook:", JSON.stringify(body, null, 2));

    // Returns a '200 OK' response to all requests (required by Facebook/Instagram)
    res.status(200).send("EVENT_RECEIVED");

    // Process event asynchronously
    await processWebhookEvent(body);
  } catch (error) {
    console.error("Error processing instagram webhook:", error);
  }
};

// --- Messaging API ---
export const sendMessengerMessage = async (req, res, next) => {
  try {
    const { businessId } = await getBusinessAndBranchForUser(req.user);
    if (!businessId) throw new AppError(404, "Business not found for this user");
    
    const { recipientId, message } = req.body;

    if (!recipientId || !message) {
      throw new AppError(400, "recipientId, and message are required.");
    }

    const responseData = await sendMessageToUser(businessId, recipientId, message);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Message sent successfully",
      data: responseData,
    });
  } catch (error) {
    next(error);
  }
};

export const sendMediaMessage = async (req, res, next) => {
  try {
    const { businessId } = await getBusinessAndBranchForUser(req.user);
    if (!businessId) throw new AppError(404, "Business not found for this user");
    
    const { recipientId, type } = req.body;
    let finalUrl = req.body.url;

    if (!recipientId || !type) {
      throw new AppError(400, "recipientId and type (image/video/audio/document) are required.");
    }

    let filePath = null;

    if (req.file) {
      finalUrl = `${envVars.BACKEND_URL}/uploads/instagram/${req.file.filename}`;
      filePath = `uploads/instagram/${req.file.filename}`;
    }

    if (!finalUrl) {
      throw new AppError(400, "Either a file must be uploaded or a media url must be provided.");
    }

    const responseData = await sendMediaMessageToUser(businessId, recipientId, type, finalUrl, filePath);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Media sent successfully",
      data: responseData,
    });
  } catch (error) {
    next(error);
  }
};

export const getConversations = async (req, res, next) => {
  try {
    const { businessId, branchId: userBranchId, isOwner } = await getBusinessAndBranchForUser(req.user);
    if (!businessId) throw new AppError(404, "Business not found for this user");
    
    // If owner: filter by query branchId (optional), else return all.
    // If branch manager: strictly filter by their branchId.
    const branchId = isOwner ? (req.query.branchId || null) : userBranchId;
    
    const conversations = await getConversationsService(businessId, branchId);
    
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Conversations retrieved successfully",
      data: conversations,
    });
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    if (!conversationId) {
      throw new AppError(400, "conversationId is required.");
    }
    
    const messages = await getMessagesService(conversationId);
    
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Messages retrieved successfully",
      data: messages,
    });
  } catch (error) {
    next(error);
  }
};

export const checkConnectionStatus = async (req, res, next) => {
  try {
    const { businessId, branchId: userBranchId, isOwner } = await getBusinessAndBranchForUser(req.user);
    if (!businessId) throw new AppError(404, "Business not found for this user");

    const branchId = isOwner ? (req.query.branchId || null) : userBranchId;

    const whereClause = { businessId, provider: "instagram", isActive: true };
    if (branchId) {
      whereClause.branchId = branchId;
    }

    const connections = await prisma.socialConnection.findMany({
      where: whereClause,
    });

    if (connections.length > 0) {
      const safeConnections = connections.map(({ accessToken, ...safe }) => safe);
      res.json({ success: true, connected: true, data: safeConnections });
    } else {
      res.json({ success: true, connected: false });
    }
  } catch (error) {
    next(error);
  }
};
