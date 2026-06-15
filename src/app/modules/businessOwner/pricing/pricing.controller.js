import { sendResponse } from "../../../utils/sendResponse.js";
import { StatusCodes } from "http-status-codes";
import { PricingService } from "./pricing.service.js";
import prisma from "../../../prisma/client.js";
import DevBuildError from "../../../lib/DevBuildError.js";

const createPricing = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        
        if (!userId) {
            throw new DevBuildError("User is not authenticated", StatusCodes.UNAUTHORIZED);
        }

        // Find the business owned by the logged-in user
        const business = await prisma.business.findFirst({
            where: { ownerId: userId }
        });

        if (!business) {
            throw new DevBuildError("No business found for the logged-in user", StatusCodes.BAD_REQUEST);
        }

        req.body.businessId = business.id;
        req.body.createdById = userId;

        if (req.body.configuration && typeof req.body.configuration === "string") {
            try {
                req.body.configuration = JSON.parse(req.body.configuration);
            } catch (err) {
                // Ignore if not valid JSON
            }
        }

        const result = await PricingService.createPricingService(req.body);

        sendResponse(res, {
            statusCode: StatusCodes.CREATED,
            success: true,
            message: "Pricing created successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getAllPricings = async (req, res, next) => {
    try {
        const result = await PricingService.getAllPricingsService(req.query);

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Pricings retrieved successfully",
            meta: result.meta,
            data: result.data,
        });
    } catch (error) {
        next(error);
    }
};

const getPricingById = async (req, res, next) => {
    try {
        const result = await PricingService.getPricingByIdService(req.params.id, req.query);

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Pricing retrieved successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const updatePricing = async (req, res, next) => {
    try {
        if (req.body.configuration && typeof req.body.configuration === "string") {
            try {
                req.body.configuration = JSON.parse(req.body.configuration);
            } catch (err) {
                // Ignore if not valid JSON
            }
        }
        const result = await PricingService.updatePricingService(req.params.id, req.body);

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Pricing updated successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const deletePricing = async (req, res, next) => {
    try {
        const result = await PricingService.deletePricingService(req.params.id);

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Pricing deleted successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const PricingController = {
    createPricing,
    getAllPricings,
    getPricingById,
    updatePricing,
    deletePricing,
};
