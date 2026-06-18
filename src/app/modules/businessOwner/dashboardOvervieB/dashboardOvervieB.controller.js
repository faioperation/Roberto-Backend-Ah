import { sendResponse } from "../../../utils/sendResponse.js";
import { StatusCodes } from "http-status-codes";
import { DashboardOverviewBService } from "./dashboardOvervieB.service.js";

const getDashboardOverview = async (req, res, next) => {
    try {
        const businessId = req.business.id;

        const result = await DashboardOverviewBService.getDashboardOverviewService(businessId);

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

export const DashboardOverviewBController = {
    getDashboardOverview,
};
