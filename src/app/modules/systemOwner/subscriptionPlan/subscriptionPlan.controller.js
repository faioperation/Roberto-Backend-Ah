import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../../utils/sendResponse.js";
import { SubscriptionPlanService } from "./subscriptionPlan.service.js";

const createSubscriptionPlan = async (req, res, next) => {
    try {
        const payload = req.body;
        if (req.user && req.user.id) {
            payload.createdById = req.user.id;
        }

        const result = await SubscriptionPlanService.createSubscriptionPlanService(payload);

        sendResponse(res, {
            success: true,
            message: "Subscription plan created successfully",
            statusCode: StatusCodes.CREATED,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getAllSubscriptionPlans = async (req, res, next) => {
    try {
        const result = await SubscriptionPlanService.getAllSubscriptionPlansService(req.query);

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

const getSubscriptionPlanById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await SubscriptionPlanService.getSubscriptionPlanByIdService(id, req.query);

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

const updateSubscriptionPlan = async (req, res, next) => {
    try {
        const { id } = req.params;
        const payload = req.body;

        const result = await SubscriptionPlanService.updateSubscriptionPlanService(id, payload);

        sendResponse(res, {
            success: true,
            message: "Subscription plan updated successfully",
            statusCode: StatusCodes.OK,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const deleteSubscriptionPlan = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await SubscriptionPlanService.deleteSubscriptionPlanService(id);

        sendResponse(res, {
            success: true,
            message: "Subscription plan deleted successfully",
            statusCode: StatusCodes.OK,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const SubscriptionPlanController = {
    createSubscriptionPlan,
    getAllSubscriptionPlans,
    getSubscriptionPlanById,
    updateSubscriptionPlan,
    deleteSubscriptionPlan,
};
