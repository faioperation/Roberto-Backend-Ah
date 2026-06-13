import prisma from "../../../prisma/client.js";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../../utils/sendResponse.js";
import { AppError } from "../../../errorHelper/appError.js";

export const getPricingsByBusinessId = async (req, res, next) => {
  try {
    const { businessId } = req.params;

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

    const pricings = await prisma.pricing.findMany({
      where: { businessId, status: true }
    });

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Pricings retrieved successfully.",
      data: pricings
    });
  } catch (error) {
    next(error);
  }
};
