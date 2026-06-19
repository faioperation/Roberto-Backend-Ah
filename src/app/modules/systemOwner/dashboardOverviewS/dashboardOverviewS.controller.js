import { sendResponse } from "../../../utils/sendResponse.js";
import { StatusCodes } from "http-status-codes";
import { DashboardOverviewSService } from "./dashboardOverviewS.service.js";

const getDashboardOverview = async (req, res, next) => {
    try {
        const result = await DashboardOverviewSService.getDashboardOverviewService(req.query);

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Dashboard overview retrieved successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const DashboardOverviewSController = {
    getDashboardOverview,
};
