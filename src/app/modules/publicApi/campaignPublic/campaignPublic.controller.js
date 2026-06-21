import { CampaignService } from "../../businessOwner/campaign/campaign.service.js";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../../utils/sendResponse.js";
import { AppError } from "../../../errorHelper/appError.js";
import prisma from "../../../prisma/client.js";

export const getAllCampaigns = async (req, res, next) => {
  try {
    const { branchId } = req.params;
    if (!branchId) {
      throw new AppError(StatusCodes.BAD_REQUEST, "branchId parameter is required.");
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(branchId)) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid branchId format. Must be a valid UUID.");
    }

    const branch = await prisma.branch.findUnique({
      where: { id: branchId }
    });

    if (!branch) {
      throw new AppError(StatusCodes.NOT_FOUND, "Branch not found.");
    }

    const businessId = branch.businessId;

    const result = await CampaignService.getAllCampaignsService(businessId, {
      ...req.query,
      branchId,
    });

    sendResponse(res, {
      success: true,
      message: "Campaigns retrieved successfully",
      statusCode: StatusCodes.OK,
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
};
