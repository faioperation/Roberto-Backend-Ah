import { sendResponse } from "../../../utils/sendResponse.js";
import { StatusCodes } from "http-status-codes";
import { DashboardOverviewMService } from "./dashboardOverviewM.service.js";
import prisma from "../../../prisma/client.js";
import DevBuildError from "../../../lib/DevBuildError.js";

const getDashboardOverview = async (req, res, next) => {
    try {
        const managerEmail = req.user?.email;

        const branchManager = await prisma.branchManager.findUnique({
            where: { email: managerEmail },
            include: { branches: true },
        });

        if (!branchManager) {
            throw new DevBuildError("Branch Manager not found", StatusCodes.BAD_REQUEST);
        }

        const branchId = branchManager.branches[0]?.id;

        if (!branchId) {
            throw new DevBuildError("Branch Manager does not have an assigned branch", StatusCodes.BAD_REQUEST);
        }

        const result = await DashboardOverviewMService.getDashboardOverviewService(
            branchManager.businessId,
            branchId
        );

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

export const DashboardOverviewMController = {
    getDashboardOverview,
};
