import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../../utils/sendResponse.js";
import { ActivityLogService } from "./activityLog.service.js";

const createActivityLog = async (req, res, next) => {
    try {
        const payload = req.body;
        if (req.user && req.user.id) {
            payload.createdById = req.user.id;
        }

        const result = await ActivityLogService.createActivityLogService(payload);

        sendResponse(res, {
            success: true,
            message: "Activity log created successfully",
            statusCode: StatusCodes.CREATED,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getAllActivityLogs = async (req, res, next) => {
    try {
        const result = await ActivityLogService.getAllActivityLogsService(req.query);

        sendResponse(res, {
            success: true,
            message: "Activity logs retrieved successfully",
            statusCode: StatusCodes.OK,
            data: result.data,
            meta: result.meta,
        });
    } catch (error) {
        next(error);
    }
};

const getActivityLogById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await ActivityLogService.getActivityLogByIdService(id, req.query);

        sendResponse(res, {
            success: true,
            message: "Activity log retrieved successfully",
            statusCode: StatusCodes.OK,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const updateActivityLog = async (req, res, next) => {
    try {
        const { id } = req.params;
        const payload = req.body;

        const result = await ActivityLogService.updateActivityLogService(id, payload);

        sendResponse(res, {
            success: true,
            message: "Activity log updated successfully",
            statusCode: StatusCodes.OK,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const deleteActivityLog = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await ActivityLogService.deleteActivityLogService(id);

        sendResponse(res, {
            success: true,
            message: "Activity log deleted successfully",
            statusCode: StatusCodes.OK,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const ActivityLogController = {
    createActivityLog,
    getAllActivityLogs,
    getActivityLogById,
    updateActivityLog,
    deleteActivityLog,
};
