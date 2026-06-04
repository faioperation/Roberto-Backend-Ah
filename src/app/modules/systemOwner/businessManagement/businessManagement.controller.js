import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../../utils/sendResponse.js";
import { BusinessService } from "./businessManagement.service.js";

const createBusiness = async (req, res, next) => {
    try {
        const payload = req.body;
        // if logged in user is creating it, we can set createdById
        if (req.user && req.user.id) {
            payload.createdById = req.user.id;
        }

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
