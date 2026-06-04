import prisma from "../../../prisma/client.js";
import DevBuildError from "../../../lib/DevBuildError.js";
import { StatusCodes } from "http-status-codes";

import { QueryBuilder } from "../../../utils/QueryBuilder.js";

const createActivityLogService = async (payload) => {
    const result = await prisma.activityLog.create({
        data: payload,
    });
    return result;
};

const getAllActivityLogsService = async (query = {}) => {
    const queryBuilder = new QueryBuilder(query)
        .search(["activityName", "activityTitle", "activityType"])
        .filter()
        .sort()
        .paginate()
        .fields();

    const queryParams = queryBuilder.build();

    if (!queryParams.select) {
        queryParams.include = {
            createdBy: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                }
            }
        };
    }

    const result = await prisma.activityLog.findMany(queryParams);
    const total = await prisma.activityLog.count({ where: queryBuilder.where });

    return {
        meta: queryBuilder.getMeta(total),
        data: result,
    };
};

const getActivityLogByIdService = async (id, query = {}) => {
    const queryBuilder = new QueryBuilder(query).fields();
    const queryParams = queryBuilder.build();

    const findArgs = {
        where: { id },
    };

    if (queryParams.select) {
        findArgs.select = queryParams.select;
    } else {
        findArgs.include = {
            createdBy: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                }
            }
        };
    }

    const result = await prisma.activityLog.findUnique(findArgs);
    
    if (!result) {
        throw new DevBuildError("Activity log not found", StatusCodes.NOT_FOUND);
    }

    return result;
};

const updateActivityLogService = async (id, payload) => {
    const isExist = await prisma.activityLog.findUnique({
        where: { id },
    });

    if (!isExist) {
        throw new DevBuildError("Activity log not found", StatusCodes.NOT_FOUND);
    }

    const result = await prisma.activityLog.update({
        where: { id },
        data: payload,
    });
    return result;
};

const deleteActivityLogService = async (id) => {
    const isExist = await prisma.activityLog.findUnique({
        where: { id },
    });

    if (!isExist) {
        throw new DevBuildError("Activity log not found", StatusCodes.NOT_FOUND);
    }

    const result = await prisma.activityLog.delete({
        where: { id },
    });
    
    return result;
};

export const ActivityLogService = {
    createActivityLogService,
    getAllActivityLogsService,
    getActivityLogByIdService,
    updateActivityLogService,
    deleteActivityLogService,
};
