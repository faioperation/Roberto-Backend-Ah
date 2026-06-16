import prisma from "../../../prisma/client.js";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../../utils/sendResponse.js";
import { AppError } from "../../../errorHelper/appError.js";

export const getPricingsByBusinessId = async (req, res, next) => {
  try {
    const { businessId } = req.params;

    if (!businessId) {
      throw new AppError(StatusCodes.BAD_REQUEST, "businessId or branchId is required.");
    }

    // First try to find as businessId
    const businessExists = await prisma.business.findUnique({
      where: { id: businessId }
    });

    if (businessExists) {
      // Found as business - fetch pricings by businessId
      const { branchId } = req.query;
      const whereClause = { businessId, status: true };
      if (branchId) {
        whereClause.branchId = branchId;
      }

      const pricings = await prisma.pricing.findMany({
        where: whereClause
      });

      return sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: "Pricings retrieved successfully.",
        data: pricings
      });
    }

    // If not found as business, try as branchId
    const branchExists = await prisma.branch.findUnique({
      where: { id: businessId }
    });

    if (branchExists) {
      const pricings = await prisma.pricing.findMany({
        where: {
          branchId: businessId,
          businessId: branchExists.businessId,
          status: true
        }
      });

      return sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: "Pricings retrieved successfully by branch.",
        data: pricings
      });
    }

    // Neither business nor branch found
    throw new AppError(StatusCodes.NOT_FOUND, `No Business or Branch found with ID ${businessId}.`);
  } catch (error) {
    next(error);
  }
};
