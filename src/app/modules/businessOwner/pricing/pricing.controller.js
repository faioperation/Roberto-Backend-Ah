import { sendResponse } from "../../../utils/sendResponse.js";
import { StatusCodes } from "http-status-codes";
import { PricingService } from "./pricing.service.js";
import prisma from "../../../prisma/client.js";
import DevBuildError from "../../../lib/DevBuildError.js";

const createPricing = async (req, res, next) => {
    try {
        req.body.businessId = req.business.id;
        req.body.createdById = req.user.id;

        if (req.body.branchId) {
            const branchExists = await prisma.branch.findFirst({
                where: { id: req.body.branchId, businessId: req.business.id }
            });
            if (!branchExists) {
                throw new DevBuildError(`Branch not found in this business`, StatusCodes.BAD_REQUEST);
            }
        }

        if (req.body.configuration && typeof req.body.configuration === "string") {
            try { req.body.configuration = JSON.parse(req.body.configuration); } catch (e) {}
        }

        const result = await PricingService.createPricingService(req.body);

        sendResponse(res, { statusCode: StatusCodes.CREATED, success: true, message: "Pricing created successfully", data: result });
    } catch (error) {
        next(error);
    }
};

const getAllPricings = async (req, res, next) => {
    try {
        req.query.businessId = req.business.id;
        const result = await PricingService.getAllPricingsService(req.query);

        sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Pricings retrieved successfully", meta: result.meta, data: result.data });
    } catch (error) {
        next(error);
    }
};

const getPricingById = async (req, res, next) => {
    try {
        const result = await PricingService.getPricingByIdService(req.params.id, req.query);

        if (result.businessId !== req.business.id) {
            throw new DevBuildError("You are not authorized to access this pricing", StatusCodes.FORBIDDEN);
        }

        sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Pricing retrieved successfully", data: result });
    } catch (error) {
        next(error);
    }
};

const updatePricing = async (req, res, next) => {
    try {
        const existing = await PricingService.getPricingByIdService(req.params.id, {});
        if (existing.businessId !== req.business.id) {
            throw new DevBuildError("You are not authorized to update this pricing", StatusCodes.FORBIDDEN);
        }

        if (req.body.branchId) {
            const branchExists = await prisma.branch.findFirst({
                where: { id: req.body.branchId, businessId: req.business.id }
            });
            if (!branchExists) {
                throw new DevBuildError(`Branch not found in this business`, StatusCodes.BAD_REQUEST);
            }
        }

        if (req.body.configuration && typeof req.body.configuration === "string") {
            try { req.body.configuration = JSON.parse(req.body.configuration); } catch (e) {}
        }

        const result = await PricingService.updatePricingService(req.params.id, req.body);

        sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Pricing updated successfully", data: result });
    } catch (error) {
        next(error);
    }
};

const deletePricing = async (req, res, next) => {
    try {
        const existing = await PricingService.getPricingByIdService(req.params.id, {});
        if (existing.businessId !== req.business.id) {
            throw new DevBuildError("You are not authorized to delete this pricing", StatusCodes.FORBIDDEN);
        }

        const result = await PricingService.deletePricingService(req.params.id);

        sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Pricing deleted successfully", data: result });
    } catch (error) {
        next(error);
    }
};

export const PricingController = { createPricing, getAllPricings, getPricingById, updatePricing, deletePricing };
