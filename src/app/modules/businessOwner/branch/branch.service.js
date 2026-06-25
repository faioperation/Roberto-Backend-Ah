import prisma from "../../../prisma/client.js";
import DevBuildError from "../../../lib/DevBuildError.js";
import { StatusCodes } from "http-status-codes";
import { QueryBuilder } from "../../../utils/QueryBuilder.js";
import { NotificationService } from "../../notification/notification.service.js";
import { checkBranchLimit } from "../../../utils/limitChecker.js";

const createBranchService = async (payload) => {
    await checkBranchLimit(payload.businessId);

    const result = await prisma.branch.create({
        data: payload,
    });
    
    // Trigger notification to System Owners (and business owner since we pass businessId)
    NotificationService.createAndSendNotification({
        title: "New Branch Created",
        message: `A new branch "${result.name}" has been created.`,
        type: "BRANCH_CREATE",
        businessId: result.businessId,
        branchId: result.id,
    }).catch(err => console.error("Error sending branch creation notification:", err));

    return result;
};

const getAllBranchesService = async (query = {}) => {
    const queryBuilder = new QueryBuilder(query)
        .search(["name", "email", "phone"])
        .filter()
        .sort()
        .paginate()
        .fields();

    const queryParams = queryBuilder.build();

    if (!queryParams.select) {
        queryParams.include = {
            manager: {
                select: {
                    id: true,
                    email: true,
                    name: true,
                }
            },
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

    const result = await prisma.branch.findMany(queryParams);
    const total = await prisma.branch.count({ where: queryBuilder.where });

    return {
        meta: queryBuilder.getMeta(total),
        data: result,
    };
};

const getBranchByIdService = async (id, query = {}) => {
    const queryBuilder = new QueryBuilder(query).fields();
    const queryParams = queryBuilder.build();

    const findArgs = {
        where: { id },
    };

    if (queryParams.select) {
        findArgs.select = queryParams.select;
    } else {
        findArgs.include = {
            manager: {
                select: {
                    id: true,
                    email: true,
                    name: true,
                }
            },
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

    const result = await prisma.branch.findUnique(findArgs);
    
    if (!result) {
        throw new DevBuildError("Branch not found", StatusCodes.NOT_FOUND);
    }

    return result;
};

const updateBranchService = async (id, payload) => {
    const isExist = await prisma.branch.findUnique({
        where: { id },
    });

    if (!isExist) {
        throw new DevBuildError("Branch not found", StatusCodes.NOT_FOUND);
    }

    const result = await prisma.branch.update({
        where: { id },
        data: payload,
    });
    
    return result;
};

const deleteBranchService = async (id) => {
    const isExist = await prisma.branch.findUnique({
        where: { id },
    });

    if (!isExist) {
        throw new DevBuildError("Branch not found", StatusCodes.NOT_FOUND);
    }

    const result = await prisma.branch.delete({
        where: { id },
    });
    
    return result;
};

export const BranchService = {
    createBranchService,
    getAllBranchesService,
    getBranchByIdService,
    updateBranchService,
    deleteBranchService,
};
