import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../../utils/sendResponse.js";
import { BusinessService } from "./businessManagement.service.js";
import jwt from "jsonwebtoken";
import prisma from "../../../prisma/client.js";
import { envVars } from "../../../config/env.js";

const createBusiness = async (req, res, next) => {
    try {
        const payload = req.body;
        let isSystemOwner = false;
        let creatorUserId = null;

        // Parse Authorization header optionally to check if the creator is a SYSTEM_OWNER
        if (req.headers.authorization) {
            try {
                const token = req.headers.authorization.replace(/^Bearer\s*/i, "");
                const decoded = jwt.verify(token, envVars.JWT_SECRET_TOKEN);
                const creatorUser = await prisma.user.findUnique({
                    where: { id: decoded.id },
                    include: { roles: { include: { role: true } } }
                });
                if (creatorUser) {
                    creatorUserId = creatorUser.id;
                    isSystemOwner = creatorUser.roles?.some(r => r.role.name === "SYSTEM_OWNER") || false;
                }
            } catch (err) {
                // Ignore token errors since authentication is optional for creation
            }
        }

        // if logged in user is creating it, we can set createdById
        if (req.user && req.user.id) {
            payload.createdById = req.user.id;
        } else if (creatorUserId) {
            payload.createdById = creatorUserId;
        }

        payload.isSystemOwner = isSystemOwner;

        const result = await BusinessService.createBusinessService(payload);

        sendResponse(res, {
            success: true,
            message: "Business created successfully",
            statusCode: StatusCodes.CREATED,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getAllBusinesses = async (req, res, next) => {
    try {
        const result = await BusinessService.getAllBusinessesService(req.query);

        sendResponse(res, {
            success: true,
            message: "Businesses retrieved successfully",
            statusCode: StatusCodes.OK,
            data: result.data,
            meta: result.meta,
        });
    } catch (error) {
        next(error);
    }
};

const getBusinessById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await BusinessService.getBusinessByIdService(id, req.query);

        sendResponse(res, {
            success: true,
            message: "Business retrieved successfully",
            statusCode: StatusCodes.OK,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const updateBusiness = async (req, res, next) => {
    try {
        const { id } = req.params;
        const payload = req.body;

        const result = await BusinessService.updateBusinessService(id, payload);

        sendResponse(res, {
            success: true,
            message: "Business updated successfully",
            statusCode: StatusCodes.OK,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const deleteBusiness = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await BusinessService.deleteBusinessService(id);

        sendResponse(res, {
            success: true,
            message: "Business deleted successfully",
            statusCode: StatusCodes.OK,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const BusinessController = {
    createBusiness,
    getAllBusinesses,
    getBusinessById,
    updateBusiness,
    deleteBusiness,
};
