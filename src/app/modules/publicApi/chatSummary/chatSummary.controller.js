import prisma from "../../../prisma/client.js";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../../utils/sendResponse.js";
import { AppError } from "../../../errorHelper/appError.js";

export const upsertChatSummary = async (req, res, next) => {
  try {
    const {
      conversationId,
      businessId,
      items,
      pickup_area,
      destination,
      weight,
      pickup_date_time,
      current_status,
      recent_summary,
      booking_info,
      summary,
      key_points,
      intent,
      confidence,
      reason,
    } = req.body;

    if (!conversationId) {
      throw new AppError(StatusCodes.BAD_REQUEST, "conversationId is required.");
    }
    if (!businessId) {
      throw new AppError(StatusCodes.BAD_REQUEST, "businessId is required.");
    }

    // Verify if business exists
    const businessExists = await prisma.business.findUnique({
      where: { id: businessId }
    });
    if (!businessExists) {
      throw new AppError(StatusCodes.NOT_FOUND, `Business with ID ${businessId} not found.`);
    }

    const payload = {
      businessId,
      items: items || null,
      pickupArea: pickup_area || null,
      destination: destination || null,
      weight: weight || null,
      pickupDateTime: pickup_date_time || null,
      currentStatus: current_status || null,
      recentSummary: recent_summary || null,
      bookingInfo: booking_info || null,
      summary: summary || null,
      keyPoints: key_points || [],
      intent: intent || null,
      confidence: confidence || null,
      reason: reason || null,
    };

    const chatSummary = await prisma.chatSummary.upsert({
      where: { conversationId },
      update: payload,
      create: {
        conversationId,
        ...payload
      }
    });

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Chat summary saved successfully.",
      data: chatSummary
    });
  } catch (error) {
    next(error);
  }
};
