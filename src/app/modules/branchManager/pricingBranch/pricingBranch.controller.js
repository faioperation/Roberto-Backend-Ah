import { sendResponse } from "../../../utils/sendResponse.js";
import { StatusCodes } from "http-status-codes";
import { PricingBranchService } from "./pricingBranch.service.js";
import prisma from "../../../prisma/client.js";
import DevBuildError from "../../../lib/DevBuildError.js";

const createPricing = async (req, res, next) => {
    try {
        const managerEmail = req.user?.email;
        
        if (!managerEmail) {
            throw new DevBuildError("User email is missing in token", StatusCodes.UNAUTHORIZED);
        }

        const branchManager = await prisma.branchManager.findUnique({
            where: { email: managerEmail },
            include: { branches: true }
        });

        if (!branchManager) {
            throw new DevBuildError("Branch Manager not found", StatusCodes.BAD_REQUEST);
        }
        
        const branchId = branchManager.branches[0]?.id;
        
        if (!branchId) {
            throw new DevBuildError("Branch Manager does not have an assigned branch", StatusCodes.BAD_REQUEST);
        }

        req.body.businessId = branchManager.businessId;
        req.body.branchId = branchId;
        req.body.createdById = req.user?.id;

        if (req.body.configuration && typeof req.body.configuration === "string") {
            try {
                req.body.configuration = JSON.parse(req.body.configuration);
            } catch (err) {
                // Ignore if not valid JSON
            }
        }

        const result = await PricingBranchService.createPricingService(req.body);

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
        const managerEmail = req.user?.email;
        const branchManager = await prisma.branchManager.findUnique({
            where: { email: managerEmail },
            include: { branches: true }
        });
        
        if (!branchManager) throw new DevBuildError("Branch Manager not found", StatusCodes.BAD_REQUEST);

        const filter = { 
            businessId: branchManager.businessId,
            branchId: branchManager.branches[0]?.id
        };

        const result = await PricingBranchService.getAllPricingsService(req.query, filter);

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
        const managerEmail = req.user?.email;
        const branchManager = await prisma.branchManager.findUnique({
            where: { email: managerEmail },
            include: { branches: true }
        });

        if (!branchManager) throw new DevBuildError("Branch Manager not found", StatusCodes.BAD_REQUEST);

        const filter = { 
            businessId: branchManager.businessId,
            branchId: branchManager.branches[0]?.id
        };

        const result = await PricingBranchService.getPricingByIdService(req.params.id, filter, req.query);

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
        const managerEmail = req.user?.email;
        const branchManager = await prisma.branchManager.findUnique({
            where: { email: managerEmail },
            include: { branches: true }
        });

        if (!branchManager) throw new DevBuildError("Branch Manager not found", StatusCodes.BAD_REQUEST);

        const filter = { 
            businessId: branchManager.businessId,
            branchId: branchManager.branches[0]?.id
        };

        if (req.body.configuration && typeof req.body.configuration === "string") {
            try {
                req.body.configuration = JSON.parse(req.body.configuration);
            } catch (err) {
                // Ignore if not valid JSON
            }
        }

        const result = await PricingBranchService.updatePricingService(req.params.id, filter, req.body);

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
        const managerEmail = req.user?.email;
        const branchManager = await prisma.branchManager.findUnique({
            where: { email: managerEmail },
            include: { branches: true }
        });

        if (!branchManager) throw new DevBuildError("Branch Manager not found", StatusCodes.BAD_REQUEST);

        const filter = { 
            businessId: branchManager.businessId,
            branchId: branchManager.branches[0]?.id
        };

        const result = await PricingBranchService.deletePricingService(req.params.id, filter);

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

export const PricingBranchController = {
    createPricing,
    getAllPricings,
    getPricingById,
    updatePricing,
    deletePricing,
};
