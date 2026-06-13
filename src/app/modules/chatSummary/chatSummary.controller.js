import prisma from "../../prisma/client.js";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/sendResponse.js";
import { AppError } from "../../errorHelper/appError.js";

export const getChatSummaryByConversation = async (req, res, next) => {
  try {
    const { conversationId } = req.params;

    if (!conversationId) {
      throw new AppError(StatusCodes.BAD_REQUEST, "conversationId is required.");
    }

    const chatSummary = await prisma.chatSummary.findUnique({
      where: { conversationId }
    });

    if (!chatSummary) {
      throw new AppError(StatusCodes.NOT_FOUND, "Chat summary not found for this conversation.");
    }

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Chat summary retrieved successfully.",
      data: chatSummary
    });
  } catch (error) {
    next(error);
  }
};
