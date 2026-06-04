import { AppError } from "../../../errorHelper/appError.js";
import { WhatsappService } from "../../whatsapp/whatsapp.service.js";

export const sendWhatsappMessage = async (req, res, next) => {
  try {
    const { businessId, conversationId, message } = req.body;

    if (!businessId || !conversationId || !message) {
      throw new AppError(400, "businessId, conversationId, and message are required.");
    }

    const result = await WhatsappService.sendTextMessage(businessId, conversationId, message);

    res.status(200).json({
      success: true,
      message: "Message sent via AI Developer API",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
