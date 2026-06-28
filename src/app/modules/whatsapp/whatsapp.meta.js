import axios from "axios";
import { envVars } from "../../config/env.js";

export const MetaGraphAPI = {
  sendMessage: async (phoneNumberId, accessToken, to, text) => {
    const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: to,
      type: "text",
      text: { body: text },
    };
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };
    const response = await axios.post(url, payload, { headers });
    return response.data;
  },

  sendMedia: async (phoneNumberId, accessToken, to, type, mediaUrl) => {
    const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: to,
      type: type, // "image", "document", "video"
      [type]: { link: mediaUrl },
    };
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };
    const response = await axios.post(url, payload, { headers });
    return response.data;
  },

  sendTemplate: async (phoneNumberId, accessToken, to, templateName, languageCode, components) => {
    const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
    const payload = {
      messaging_product: "whatsapp",
      to: to,
      type: "template",
      template: {
        name: templateName,
        language: { code: languageCode },
        components: components || [],
      },
    };
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };
    const response = await axios.post(url, payload, { headers });
    return response.data;
  },
  
  markAsRead: async (phoneNumberId, accessToken, messageId) => {
    const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
    const payload = {
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId,
    };
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };
    const response = await axios.post(url, payload, { headers });
    return response.data;
  },

  getAccessToken: async (code, redirectUri) => {
    const url = `https://graph.facebook.com/${envVars.META_GRAPH_VERSION || "v23.0"}/oauth/access_token`;
    const response = await axios.get(url, {
      params: {
        client_id: envVars.META_APP_ID,
        redirect_uri: redirectUri,
        client_secret: envVars.META_APP_SECRET,
        code,
      },
    });
    return response.data.access_token;
  },

  getWabaAccounts: async (accessToken) => {
    const url = `https://graph.facebook.com/debug_token`;
    const response = await axios.get(url, {
      params: {
        input_token: accessToken,
        access_token: `${envVars.META_APP_ID}|${envVars.META_APP_SECRET}`,
      },
    });
    const granularScopes = response.data?.data?.granular_scopes || [];
    const whatsappScope = granularScopes.find((s) => s.scope === "whatsapp_business_management");
    const targetIds = whatsappScope?.target_ids || [];
    return targetIds.map((id) => ({ id }));
  },

  getWabaPhoneNumbers: async (wabaId, accessToken) => {
    const url = `https://graph.facebook.com/${envVars.META_GRAPH_VERSION || "v23.0"}/${wabaId}/phone_numbers`;
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data.data;
  }
};
