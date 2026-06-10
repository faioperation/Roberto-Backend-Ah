import prisma from "../../../prisma/client.js";
import DevBuildError from "../../../lib/DevBuildError.js";
import { StatusCodes } from "http-status-codes";
import bcrypt from "bcrypt";
import { envVars } from "../../../config/env.js";

import { QueryBuilder } from "../../../utils/QueryBuilder.js";

const createBusinessService = async (payload) => {
    let isSystemOwner = payload.isSystemOwner || false;
    delete payload.isSystemOwner;

    const result = await prisma.$transaction(async (transactionClient) => {
        let user = null;

        if (!isSystemOwner && payload.createdById) {
            const creator = await transactionClient.user.findUnique({
                where: { id: payload.createdById },
                include: { roles: { include: { role: true } } }
            });
            if (creator) {
                isSystemOwner = creator.roles.some(r => r.role.name === "SYSTEM_OWNER");
            }
        }

        if (payload.ownerEmail && payload.ownerPassword) {
            // Check if user already exists
            const existingUser = await transactionClient.user.findUnique({
                where: { email: payload.ownerEmail }
            });

            if (existingUser) {
                throw new DevBuildError("User with this owner email already exists", StatusCodes.BAD_REQUEST);
            }

            // Hash the owner password for the user
            const hashedPassword = await bcrypt.hash(
                payload.ownerPassword,
                Number(envVars.BCRYPT_SALT_ROUND || 10)
            );

            // Create the user
            user = await transactionClient.user.create({
                data: {
                    firstName: payload.ownerName || null,
                    email: payload.ownerEmail,
                    passwordHash: hashedPassword,
                    phone: payload.ownerPhone || null,
                    isVerified: true,
                    roles: {
                        create: {
                            role: {
                                connect: { name: "BUSINESS_OWNER" }
                            }
                        }
                    }
                }
            });

            // 1. Save the business owner id in the SystemBusiness payload
            payload.businessOwnerId = user.id;

            // 2. Data entry in the Business Owner model (businesses table)
            await transactionClient.business.create({
                data: {
                    ownerId: user.id,
                    name: payload.businessName,
                    email: payload.ownerEmail,
                    phone: payload.ownerPhone,
                    status: isSystemOwner ? "ACTIVE" : "INACTIVE"
                }
            });
        }

        // Force system business status based on whether creator is system owner
        payload.status = isSystemOwner ? "ACTIVE" : "INACTIVE";

        const business = await transactionClient.systemBusiness.create({
            data: payload,
        });

        await transactionClient.activityLog.create({
            data: {
                activityName: "System Business Created",
                activityTitle: `A new business named "${business.businessName}" has been created.`,
                activityType: "CREATE",
                createdById: payload.createdById || null,
            }
        });

        return business;
    });

    return result;
};

const getAllBusinessesService = async (query = {}) => {
    const queryBuilder = new QueryBuilder(query)
        .search(["businessName", "ownerName", "ownerEmail"])
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

    const result = await prisma.systemBusiness.findMany(queryParams);
    const total = await prisma.systemBusiness.count({ where: queryBuilder.where });

    // Exclude fields
    result.forEach((item) => {
        delete item.createdById;
        delete item.planId;
    });

    return {
        meta: queryBuilder.getMeta(total),
        data: result,
    };
};

const getBusinessByIdService = async (id, query = {}) => {
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

    const result = await prisma.systemBusiness.findUnique(findArgs);
    
    if (!result) {
        throw new DevBuildError("Business not found", StatusCodes.NOT_FOUND);
    }

    delete result.createdById;
    delete result.planId;
    
    return result;
};

const updateBusinessService = async (id, payload) => {
    const isExist = await prisma.systemBusiness.findUnique({
        where: { id },
    });

    if (!isExist) {
        throw new DevBuildError("Business not found", StatusCodes.NOT_FOUND);
    }

    const result = await prisma.systemBusiness.update({
        where: { id },
        data: payload,
    });
    return result;
};

const deleteBusinessService = async (id) => {
    const isExist = await prisma.systemBusiness.findUnique({
        where: { id },
    });

    if (!isExist) {
        throw new DevBuildError("Business not found", StatusCodes.NOT_FOUND);
    }

    const result = await prisma.systemBusiness.delete({
        where: { id },
    });
    return result;
};

export const BusinessService = {
    createBusinessService,
    getAllBusinessesService,
    getBusinessByIdService,
    updateBusinessService,
    deleteBusinessService,
};
