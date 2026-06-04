import { sendResponse } from "../../../utils/sendResponse.js";
import { StatusCodes } from "http-status-codes";
import { CrmLeadsManagerService } from "./crmLeadsManager.service.js";
import prisma from "../../../prisma/client.js";
import DevBuildError from "../../../lib/DevBuildError.js";

const createCrmLead = async (req, res, next) => {
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

        const result = await CrmLeadsManagerService.createCrmLeadService(req.body);

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

        const result = await CrmLeadsManagerService.getAllCrmLeadsService(req.query, filter);

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

        const result = await CrmLeadsManagerService.getCrmLeadByIdService(req.params.id, filter, req.query);

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

        const result = await CrmLeadsManagerService.updateCrmLeadService(req.params.id, filter, req.body);

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

        const result = await CrmLeadsManagerService.deleteCrmLeadService(req.params.id, filter);

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

export const CrmLeadsManagerController = {
    createCrmLead,
    getAllCrmLeads,
    getCrmLeadById,
    updateCrmLead,
    deleteCrmLead,
};
