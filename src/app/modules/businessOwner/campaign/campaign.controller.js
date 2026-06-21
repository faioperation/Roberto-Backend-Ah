import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../../utils/sendResponse.js";
import { CampaignService } from "./campaign.service.js";

const createCampaign = async (req, res, next) => {
    try {
        const businessId = req.business.id;
        const result = await CampaignService.createCampaignService(businessId, req.body);

        sendResponse(res, {
            success: true,
            message: "Campaign created successfully",
            statusCode: StatusCodes.CREATED,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getAllCampaigns = async (req, res, next) => {
    try {
        const businessId = req.business.id;
        const result = await CampaignService.getAllCampaignsService(businessId, req.query);

        sendResponse(res, {
            success: true,
            message: "Campaigns retrieved successfully",
            statusCode: StatusCodes.OK,
            data: result.data,
            meta: result.meta,
        });
    } catch (error) {
        next(error);
    }
};

const getCampaignById = async (req, res, next) => {
    try {
        const businessId = req.business.id;
        const { id } = req.params;
        const result = await CampaignService.getCampaignByIdService(businessId, id);

        sendResponse(res, {
            success: true,
            message: "Campaign retrieved successfully",
            statusCode: StatusCodes.OK,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const updateCampaign = async (req, res, next) => {
    try {
        const businessId = req.business.id;
        const { id } = req.params;
        const result = await CampaignService.updateCampaignService(businessId, id, req.body);

        sendResponse(res, {
            success: true,
            message: "Campaign updated successfully",
            statusCode: StatusCodes.OK,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const deleteCampaign = async (req, res, next) => {
    try {
        const businessId = req.business.id;
        const { id } = req.params;
        const result = await CampaignService.deleteCampaignService(businessId, id);

        sendResponse(res, {
            success: true,
            message: "Campaign deleted successfully",
            statusCode: StatusCodes.OK,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const CampaignController = {
    createCampaign,
    getAllCampaigns,
    getCampaignById,
    updateCampaign,
    deleteCampaign,
};
