import axios from "axios";

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
  }
};
