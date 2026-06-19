import { sendResponse } from "../../../utils/sendResponse.js";
import { StatusCodes } from "http-status-codes";
import { CrmLeadService } from "./crmLead.service.js";
import DevBuildError from "../../../lib/DevBuildError.js";

const createCrmLead = async (req, res, next) => {
    try {
        req.body.businessId = req.business.id;
        req.body.createdById = req.user.id;

        const result = await CrmLeadService.createCrmLeadService(req.body);

        sendResponse(res, { statusCode: StatusCodes.CREATED, success: true, message: "CRM Lead created successfully", data: result });
    } catch (error) {
        next(error);
    }
};

const getAllCrmLeads = async (req, res, next) => {
    try {
        req.query.businessId = req.business.id;
        const result = await CrmLeadService.getAllCrmLeadsService(req.query);

        sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "CRM Leads retrieved successfully", meta: result.meta, data: result.data });
    } catch (error) {
        next(error);
    }
};

const getCrmLeadById = async (req, res, next) => {
    try {
        const result = await CrmLeadService.getCrmLeadByIdService(req.params.id, req.query);

        if (result.businessId !== req.business.id) {
            throw new DevBuildError("You are not authorized to access this CRM lead", StatusCodes.FORBIDDEN);
        }

        sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "CRM Lead retrieved successfully", data: result });
    } catch (error) {
        next(error);
    }
};

const updateCrmLead = async (req, res, next) => {
    try {
        const existing = await CrmLeadService.getCrmLeadByIdService(req.params.id, {});
        if (existing.businessId !== req.business.id) {
            throw new DevBuildError("You are not authorized to update this CRM lead", StatusCodes.FORBIDDEN);
        }

        const result = await CrmLeadService.updateCrmLeadService(req.params.id, req.body);

        sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "CRM Lead updated successfully", data: result });
    } catch (error) {
        next(error);
    }
};

const deleteCrmLead = async (req, res, next) => {
    try {
        const existing = await CrmLeadService.getCrmLeadByIdService(req.params.id, {});
        if (existing.businessId !== req.business.id) {
            throw new DevBuildError("You are not authorized to delete this CRM lead", StatusCodes.FORBIDDEN);
        }

        const result = await CrmLeadService.deleteCrmLeadService(req.params.id);

        sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "CRM Lead deleted successfully", data: result });
    } catch (error) {
        next(error);
    }
};

export const CrmLeadController = { createCrmLead, getAllCrmLeads, getCrmLeadById, updateCrmLead, deleteCrmLead };
