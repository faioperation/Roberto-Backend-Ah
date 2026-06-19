import axios from "axios";
import prisma from "../../prisma/client.js";
import { envVars } from "../../config/env.js";
import { getLongLivedToken, getPageTokens, subscribeAppToPage } from "./facebook.service.js";
import { processWebhookEvent } from "./webhook.service.js";
import { sendMessageToUser, sendMediaMessageToUser, getConversations as getConversationsService, getMessages as getMessagesService } from "./messenger.service.js";
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

    const redirectUri = envVars.FACEBOOK_REDIRECT_URI;
    const appId = envVars.META_APP_ID;
    const permissions = "pages_show_list,pages_manage_metadata,pages_messaging,business_management";
    
    // Using state to pass businessId and branchId to callback
    const state = JSON.stringify({ businessId, branchId });
    const graphVersion = envVars.META_GRAPH_VERSION || "v23.0";

    const authUrl = `https://www.facebook.com/${graphVersion}/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${permissions}&state=${encodeURIComponent(state)}`;

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Facebook OAuth URL generated successfully.",
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
      throw new AppError(400, `Facebook OAuth Error: ${error_description}`);
    }

    if (!code || !state) {
      throw new AppError(400, "Missing code or state from Facebook OAuth");
    }

    const parsedState = JSON.parse(state);
    const businessId = parsedState.businessId;
    const branchId = parsedState.branchId || null;
    const redirectUri = envVars.FACEBOOK_REDIRECT_URI;
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

    // 3. Fetch pages
    const pages = await getPageTokens(longLivedToken);

    // 4. Save pages in database and subscribe to webhooks
    for (const page of pages) {
      // Check if connection exists
      const connection = await prisma.socialConnection.findFirst({
        where: { businessId, pageId: page.id, provider: "facebook" },
      });

      if (connection) {
        // Update existing connection
        await prisma.socialConnection.update({
          where: { id: connection.id },
          data: {
            accessToken: page.access_token,
            pageName: page.name,
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
            provider: "facebook",
            pageId: page.id,
            pageName: page.name,
            accessToken: page.access_token,
          },
        });
      }

      // Automatically subscribe app to page webhook
      await subscribeAppToPage(page.id, page.access_token);
    }

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Facebook pages connected successfully.",
      data: { pages: pages.map((p) => ({ id: p.id, name: p.name })) },
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
      if (mode === "subscribe" && token === envVars.FACEBOOK_VERIFY_TOKEN) {
        console.log("FACEBOOK_WEBHOOK_VERIFIED");
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
    console.log("📥 Received Facebook Webhook:", JSON.stringify(body, null, 2));

    // Returns a '200 OK' response to all requests (required by Facebook)
    res.status(200).send("EVENT_RECEIVED");

    // Process event asynchronously
    await processWebhookEvent(body);
  } catch (error) {
    console.error("Error processing webhook:", error);
    // Don't call next(error) here to avoid sending 500 back to Facebook
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
      // Use BACKEND_URL from envVars
      finalUrl = `${envVars.BACKEND_URL}/uploads/messenger/${req.file.filename}`;
      // Save the actual relative path from the server
      filePath = `uploads/messenger/${req.file.filename}`;
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

    const whereClause = { businessId, provider: "facebook", isActive: true };
    if (branchId) {
      whereClause.branchId = branchId;
    }

    const connections = await prisma.socialConnection.findMany({
      where: whereClause,
    });

    if (connections.length > 0) {
      // Omit accessToken from the response for security
      const safeConnections = connections.map(({ accessToken, ...safe }) => safe);
      res.json({ success: true, connected: true, data: safeConnections });
    } else {
      res.json({ success: true, connected: false });
    }
  } catch (error) {
    next(error);
  }
};
