import { AllConversationsService } from "./allConversations.service.js";
import { sendResponse } from "../../utils/sendResponse.js";
import { AppError } from "../../errorHelper/appError.js";
import { getBusinessAndBranchForUser } from "../../utils/workflowHelpers.js";

export const AllConversationsController = {
  getAllConversations: async (req, res, next) => {
    try {
      const { businessId, branchId: userBranchId, isOwner } = await getBusinessAndBranchForUser(req.user);
      if (!businessId) {
        throw new AppError(404, "Business not found for this user");
      }

      // If owner: filter by query branchId (optional), else return all.
      // If branch manager: strictly filter by their branchId.
      const branchId = isOwner ? (req.query.branchId || null) : userBranchId;

      const conversations = await AllConversationsService.getAllConversations(businessId, branchId);

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "All conversations retrieved successfully",
        data: conversations,
      });
    } catch (error) {
      next(error);
    }
  },
};
