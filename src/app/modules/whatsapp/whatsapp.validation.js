import { z } from "zod";

export const WhatsappValidation = {
  connectAccount: z.object({
    body: z.object({
      wabaId: z.string({ required_error: "WABA ID is required" }),
      phoneNumberId: z.string({ required_error: "Phone Number ID is required" }),
      phoneNumber: z.string({ required_error: "Phone Number is required" }),
      accessToken: z.string({ required_error: "Access Token is required" }),
      branchId: z.string().uuid("Invalid branch ID format").optional().or(z.literal('')),
    }),
  }),
  sendMessage: z.object({
    body: z.object({
      conversationId: z.string({ required_error: "Conversation ID is required" }),
      message: z.string({ required_error: "Message text is required" }),
    }),
  }),
  sendMediaMessage: z.object({
    body: z.object({
      conversationId: z.string({ required_error: "Conversation ID is required" }),
      type: z.enum(["image", "document", "video", "audio"], { required_error: "Type must be one of: image, document, video, audio" }),
      url: z.string().url("Must be a valid URL").optional(),
    }),
  }),
  sendTemplateMessage: z.object({
    body: z.object({
      conversationId: z.string({ required_error: "Conversation ID is required" }),
      templateName: z.string({ required_error: "Template Name is required" }),
      languageCode: z.string().default("en_US"),
      components: z.array(z.any()).optional(),
    }),
  }),
};
