import { sendResponse } from "../../../utils/sendResponse.js";
import { StatusCodes } from "http-status-codes";
import { ParcelDeliveryService } from "./parcelDelivery.service.js";
import DevBuildError from "../../../lib/DevBuildError.js";

const createParcelDelivery = async (req, res, next) => {
    try {
        req.body.businessId = req.business.id;
        req.body.createdById = req.user.id;
        const result = await ParcelDeliveryService.createParcelDeliveryService(req.body);
        sendResponse(res, { statusCode: StatusCodes.CREATED, success: true, message: "Parcel delivery created successfully", data: result });
    } catch (error) { next(error); }
};

const getAllParcelDeliveries = async (req, res, next) => {
    try {
        req.query.businessId = req.business.id;
        const result = await ParcelDeliveryService.getAllParcelDeliveriesService(req.query);
        sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Parcel deliveries retrieved successfully", meta: result.meta, data: result.data });
    } catch (error) { next(error); }
};

const getParcelDeliveryById = async (req, res, next) => {
    try {
        const result = await ParcelDeliveryService.getParcelDeliveryByIdService(req.params.id, req.query);
        if (result.businessId !== req.business.id) throw new DevBuildError("Unauthorized", StatusCodes.FORBIDDEN);
        sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Parcel delivery retrieved successfully", data: result });
    } catch (error) { next(error); }
};

const updateParcelDelivery = async (req, res, next) => {
    try {
        const existing = await ParcelDeliveryService.getParcelDeliveryByIdService(req.params.id, {});
        if (existing.businessId !== req.business.id) throw new DevBuildError("Unauthorized", StatusCodes.FORBIDDEN);
        req.body.userId = req.user.id;
        const result = await ParcelDeliveryService.updateParcelDeliveryService(req.params.id, req.body);
        sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Parcel delivery updated successfully", data: result });
    } catch (error) { next(error); }
};

const deleteParcelDelivery = async (req, res, next) => {
    try {
        const existing = await ParcelDeliveryService.getParcelDeliveryByIdService(req.params.id, {});
        if (existing.businessId !== req.business.id) throw new DevBuildError("Unauthorized", StatusCodes.FORBIDDEN);
        const result = await ParcelDeliveryService.deleteParcelDeliveryService(req.params.id);
        sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Parcel delivery deleted successfully", data: result });
    } catch (error) { next(error); }
};

export const ParcelDeliveryController = {
    createParcelDelivery,
    getAllParcelDeliveries,
    getParcelDeliveryById,
    updateParcelDelivery,
    deleteParcelDelivery,
};
