import prisma from "../../../prisma/client.js";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../../utils/sendResponse.js";
import { AppError } from "../../../errorHelper/appError.js";

export const getAgentTraining = async (req, res, next) => {
  try {
    const businessId = req.params.businessId || req.query.businessId;

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

    // Find agent training for the business
    const agentTraining = await prisma.agentTraining.findFirst({
      where: {
        businessId,
        deletedAt: null
      }
    });

    if (!agentTraining) {
      throw new AppError(StatusCodes.NOT_FOUND, `Agent training configuration not found for Business ID ${businessId}.`);
    }

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Agent training configuration retrieved successfully.",
      data: agentTraining
    });
  } catch (error) {
    next(error);
  }
};
