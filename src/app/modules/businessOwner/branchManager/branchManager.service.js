import prisma from "../../../prisma/client.js";
import DevBuildError from "../../../lib/DevBuildError.js";
import { StatusCodes } from "http-status-codes";
import bcrypt from "bcrypt";
import { envVars } from "../../../config/env.js";
import { QueryBuilder } from "../../../utils/QueryBuilder.js";

const createBranchManagerService = async (payload) => {
    const result = await prisma.$transaction(async (transactionClient) => {
        // Check if user already exists
        const existingUser = await transactionClient.user.findUnique({
            where: { email: payload.email }
        });

        if (existingUser) {
            throw new DevBuildError("User with this email already exists", StatusCodes.BAD_REQUEST);
        }

        // Hash the password for the user
        const hashedPassword = await bcrypt.hash(
            payload.password,
            Number(envVars.BCRYPT_SALT_ROUND || 10)
        );

        // Create the user
        const user = await transactionClient.user.create({
            data: {
                firstName: payload.name,
                email: payload.email,
                passwordHash: hashedPassword,
                isVerified: true,
                roles: {
                    create: {
                        role: {
                            connect: { name: "BRANCH_MANAGER" }
                        }
                    }
                }
            }
        });

        // Create the BranchManager
        const branchManager = await transactionClient.branchManager.create({
            data: payload,
        });

        return branchManager;
    });

    return result;
};

const getAllBranchManagersService = async (query = {}) => {
    const queryBuilder = new QueryBuilder(query)
        .search(["name", "email"])
        .filter()
        .sort()
        .paginate()
        .fields();

    const queryParams = queryBuilder.build();

    if (!queryParams.select) {
        queryParams.include = {
            business: true,
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

    const result = await prisma.branchManager.findMany(queryParams);
    const total = await prisma.branchManager.count({ where: queryBuilder.where });

    // Hide passwords from response
    result.forEach((item) => {
        delete item.password;
    });

    return {
        meta: queryBuilder.getMeta(total),
        data: result,
    };
};

const getBranchManagerByIdService = async (id, query = {}) => {
    const queryBuilder = new QueryBuilder(query).fields();
    const queryParams = queryBuilder.build();

    const findArgs = {
        where: { id },
    };

    if (queryParams.select) {
        findArgs.select = queryParams.select;
    } else {
        findArgs.include = {
            business: true,
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

    const result = await prisma.branchManager.findUnique(findArgs);
    
    if (!result) {
        throw new DevBuildError("Branch Manager not found", StatusCodes.NOT_FOUND);
    }

    delete result.password;
    
    return result;
};

const updateBranchManagerService = async (id, payload) => {
    const isExist = await prisma.branchManager.findUnique({
        where: { id },
    });

    if (!isExist) {
        throw new DevBuildError("Branch Manager not found", StatusCodes.NOT_FOUND);
    }

    // If updating password, hash it
    if (payload.password) {
        payload.password = await bcrypt.hash(
            payload.password,
            Number(envVars.BCRYPT_SALT_ROUND || 10)
        );

        // Also update the associated user password if needed, but for simplicity we'll just update the BranchManager 
        // For a full system, you might want to sync changes between User and BranchManager.
    }

    const result = await prisma.branchManager.update({
        where: { id },
        data: payload,
    });
    
    delete result.password;
    return result;
};

const deleteBranchManagerService = async (id) => {
    const isExist = await prisma.branchManager.findUnique({
        where: { id },
    });

    if (!isExist) {
        throw new DevBuildError("Branch Manager not found", StatusCodes.NOT_FOUND);
    }

    const result = await prisma.branchManager.delete({
        where: { id },
    });
    
    // Might also want to delete or suspend the associated User here if they were created simultaneously.
    
    return result;
};

export const BranchManagerService = {
    createBranchManagerService,
    getAllBranchManagersService,
    getBranchManagerByIdService,
    updateBranchManagerService,
    deleteBranchManagerService,
};
