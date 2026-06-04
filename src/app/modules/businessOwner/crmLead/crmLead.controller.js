import { sendResponse } from "../../../utils/sendResponse.js";
import { StatusCodes } from "http-status-codes";
import { CrmLeadService } from "./crmLead.service.js";
import prisma from "../../../prisma/client.js";
import DevBuildError from "../../../lib/DevBuildError.js";

const createCrmLead = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        
        if (!userId) {
            throw new DevBuildError("User is not authenticated", StatusCodes.UNAUTHORIZED);
        }

        const business = await prisma.business.findFirst({
            where: { ownerId: userId }
        });

        if (!business) {
            throw new DevBuildError("No business found for the logged-in user", StatusCodes.BAD_REQUEST);
        }

        req.body.businessId = business.id;
        req.body.createdById = userId;

        const result = await CrmLeadService.createCrmLeadService(req.body);

        sendResponse(res, {
            statusCode: StatusCodes.CREATED,
            success: true,
            message: "CRM Lead created successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getAllCrmLeads = async (req, res, next) => {
    try {
        const result = await CrmLeadService.getAllCrmLeadsService(req.query);

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "CRM Leads retrieved successfully",
            meta: result.meta,
            data: result.data,
        });
    } catch (error) {
        next(error);
    }
};

const getCrmLeadById = async (req, res, next) => {
    try {
        const result = await CrmLeadService.getCrmLeadByIdService(req.params.id, req.query);

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "CRM Lead retrieved successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const updateCrmLead = async (req, res, next) => {
    try {
        const result = await CrmLeadService.updateCrmLeadService(req.params.id, req.body);

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "CRM Lead updated successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const deleteCrmLead = async (req, res, next) => {
    try {
        const result = await CrmLeadService.deleteCrmLeadService(req.params.id);

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "CRM Lead deleted successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const CrmLeadController = {
    createCrmLead,
    getAllCrmLeads,
    getCrmLeadById,
    updateCrmLead,
    deleteCrmLead,
};
