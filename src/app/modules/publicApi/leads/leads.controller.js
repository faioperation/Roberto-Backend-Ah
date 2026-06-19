import prisma from "../../../prisma/client.js";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../../utils/sendResponse.js";
import { AppError } from "../../../errorHelper/appError.js";
import { extractLeadPayload } from "../../../utils/workflowHelpers.js";

export const createLead = async (req, res, next) => {
  try {
    console.log("📥 [Public API - Create Lead] Incoming Request Data:", JSON.stringify(req.body, null, 2));
    const { businessId, name } = req.body;

    if (!businessId) throw new AppError(StatusCodes.BAD_REQUEST, "businessId is required.");
    if (!name) throw new AppError(StatusCodes.BAD_REQUEST, "name is required.");

    const businessExists = await prisma.business.findUnique({ where: { id: businessId } });
    if (!businessExists) throw new AppError(StatusCodes.NOT_FOUND, `Business with ID ${businessId} not found.`);

    const cleanPayload = await extractLeadPayload(businessId, req.body);

    if (cleanPayload.branchId) {
      const branchExists = await prisma.branch.findFirst({
        where: { id: cleanPayload.branchId, businessId }
      });
      if (!branchExists) throw new AppError(StatusCodes.NOT_FOUND, `Branch not found in this business.`);
    }

    const newLead = await prisma.crmLead.create({ data: cleanPayload });

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
