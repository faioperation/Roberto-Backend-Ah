import { AppError } from "../../../errorHelper/appError.js";
import { sendMessageToUser } from "../../messenger/messenger.service.js";

export const sendFacebookMessage = async (req, res, next) => {
  try {
    const { businessId, recipientId, message } = req.body;

    if (!businessId || !recipientId || !message) {
      throw new AppError(400, "businessId, recipientId, and message are required.");
    }

    // Pass "agent" as the senderType
    const result = await sendMessageToUser(businessId, recipientId, message, "agent");

    res.status(200).json({
      success: true,
      message: "Message sent via AI Developer API",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
