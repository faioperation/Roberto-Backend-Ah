import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../../utils/sendResponse.js";
import { PublicSubscriptionService } from "./subscriptionPlan.service.js";

// GET /public/subscription-plans
const getAllSubscriptionPlans = async (req, res, next) => {
    try {
        const result = await PublicSubscriptionService.getAllPublicSubscriptionPlansService(req.query);

        sendResponse(res, {
            success: true,
            message: "Subscription plans retrieved successfully",
            statusCode: StatusCodes.OK,
            data: result.data,
            meta: result.meta,
        });
    } catch (error) {
        next(error);
    }
};

// GET /public/subscription-plans/:id
const getSubscriptionPlanById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await PublicSubscriptionService.getPublicSubscriptionPlanByIdService(id);

        sendResponse(res, {
            success: true,
            message: "Subscription plan retrieved successfully",
            statusCode: StatusCodes.OK,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const PublicSubscriptionController = {
    getAllSubscriptionPlans,
    getSubscriptionPlanById,
};
