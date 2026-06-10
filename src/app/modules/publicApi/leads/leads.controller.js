import prisma from "../../../prisma/client.js";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../../utils/sendResponse.js";
import { AppError } from "../../../errorHelper/appError.js";

export const createLead = async (req, res, next) => {
  try {
    const { businessId, branchId, name, email, phone, source, status, address, note } = req.body;

    if (!businessId) {
      throw new AppError(StatusCodes.BAD_REQUEST, "businessId is required.");
    }

    if (!name) {
      throw new AppError(StatusCodes.BAD_REQUEST, "name is required.");
    }

    // Verify if business exists
    const businessExists = await prisma.business.findUnique({
      where: { id: businessId }
    });

    if (!businessExists) {
      throw new AppError(StatusCodes.NOT_FOUND, `Business with ID ${businessId} not found.`);
    }

    if (branchId) {
      const branchExists = await prisma.branch.findFirst({
        where: { id: branchId, businessId }
      });
      if (!branchExists) {
        throw new AppError(StatusCodes.NOT_FOUND, `Branch with ID ${branchId} not found in this business.`);
      }
    }

    const payload = {
      businessId,
      branchId: branchId || null,
      name,
      email: email || null,
      phone: phone || null,
      source: source || "WEBSITE", // Default to WEBSITE for public submissions
      status: status || "NEW",
      address: address || null,
      note: note || null,
    };

    const newLead = await prisma.crmLead.create({
      data: payload
    });

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: "Lead created successfully.",
      data: newLead
    });
  } catch (error) {
    next(error);
  }
};
