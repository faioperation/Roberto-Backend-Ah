import prisma from "../../../prisma/client.js";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../../utils/sendResponse.js";
import { AppError } from "../../../errorHelper/appError.js";
import { extractBookingPayload } from "../../../utils/workflowHelpers.js";

export const createBooking = async (req, res, next) => {
  try {
    const { businessId } = req.body;

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

    const cleanPayload = await extractBookingPayload(businessId, req.body);

    // Validate required fields
    const requiredFields = {
      customerName: cleanPayload.customerName,
      customerNumber: cleanPayload.customerNumber,
      price: cleanPayload.price,
      stageId: cleanPayload.stageId,
    };

    for (const [key, value] of Object.entries(requiredFields)) {
      if (!value) {
        throw new AppError(StatusCodes.BAD_REQUEST, `${key} is required.`);
      }
    }

    if (cleanPayload.branchId) {
      const branchExists = await prisma.branch.findFirst({
        where: { id: cleanPayload.branchId, businessId }
      });
      if (!branchExists) {
        throw new AppError(StatusCodes.NOT_FOUND, `Branch with ID ${cleanPayload.branchId} not found in this business.`);
      }
    }

    // Create the order booking using generic structure
    const newBooking = await prisma.orderBooking.create({
      data: cleanPayload,
      include: {
        stage: true
      }
    });

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: "Order booking created successfully.",
      data: newBooking
    });
  } catch (error) {
    next(error);
  }
};
