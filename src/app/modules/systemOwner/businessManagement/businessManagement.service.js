import prisma from "../../../prisma/client.js";
import DevBuildError from "../../../lib/DevBuildError.js";
import { StatusCodes } from "http-status-codes";
import bcrypt from "bcrypt";
import { envVars } from "../../../config/env.js";
import { QueryBuilder } from "../../../utils/QueryBuilder.js";

const mapBusinessType = (type) => {
    if (!type) return null;
    return String(type).toUpperCase();
};

const formatBusinessResponse = (business) => {
    if (!business) return null;
    return {
        ...business,
        businessType: business.industry
    };
};

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
        }

        if (!user) {
            throw new DevBuildError("Owner user is required to create a business", StatusCodes.BAD_REQUEST);
        }

        // Create the single Business record
        const business = await transactionClient.business.create({
            data: {
                ownerId: user.id,
                name: payload.businessName,
                email: payload.ownerEmail,
                phone: payload.ownerPhone,
                industry: mapBusinessType(payload.industry || payload.businessType),
                status: isSystemOwner ? "ACTIVE" : "INACTIVE",
                description: payload.description || null,
                planId: payload.planId || null,
                planCycle: payload.planCycle || "MONTHLY",
                createdById: payload.createdById || null,
                credits: payload.credits || 0,
            }
        });

        await transactionClient.activityLog.create({
            data: {
                activityName: "Business Created",
                activityTitle: `A new business named "${business.name}" has been created.`,
                activityType: "CREATE",
                createdById: payload.createdById || null,
            }
        });

        return formatBusinessResponse(business);
    });

    return result;
};

const getAllBusinessesService = async (query = {}) => {
    const queryBuilder = new QueryBuilder(query)
        .search(["name", "email"])
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
            },
            owner: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                }
            }
        };
    }

    const result = await prisma.business.findMany(queryParams);
    const total = await prisma.business.count({ where: queryBuilder.where });

    // Exclude fields and format response
    const formatted = result.map((item) => {
        delete item.createdById;
        delete item.planId;
        return formatBusinessResponse(item);
    });

    return {
        meta: queryBuilder.getMeta(total),
        data: formatted,
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
            },
            owner: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                }
            }
        };
    }

    const result = await prisma.business.findUnique(findArgs);
    
    if (!result) {
        throw new DevBuildError("Business not found", StatusCodes.NOT_FOUND);
    }

    delete result.createdById;
    delete result.planId;
    
    return formatBusinessResponse(result);
};

const updateBusinessService = async (id, payload) => {
    const isExist = await prisma.business.findUnique({
        where: { id },
    });

    if (!isExist) {
        throw new DevBuildError("Business not found", StatusCodes.NOT_FOUND);
    }

    // Map businessName -> name, ownerEmail -> email, ownerPhone -> phone if present
    const updateData = { ...payload };
    if (payload.businessName) {
        updateData.name = payload.businessName;
        delete updateData.businessName;
    }
    if (payload.ownerEmail) {
        updateData.email = payload.ownerEmail;
        delete updateData.ownerEmail;
    }
    if (payload.ownerPhone) {
        updateData.phone = payload.ownerPhone;
        delete updateData.ownerPhone;
    }
    
    const rawIndustry = payload.industry || payload.businessType;
    if (rawIndustry) {
        updateData.industry = mapBusinessType(rawIndustry);
    }
    delete updateData.businessType;

    const result = await prisma.business.update({
        where: { id },
        data: updateData,
    });
    return formatBusinessResponse(result);
};

const deleteBusinessService = async (id) => {
    const isExist = await prisma.business.findUnique({
        where: { id },
    });

    if (!isExist) {
        throw new DevBuildError("Business not found", StatusCodes.NOT_FOUND);
    }

    const result = await prisma.business.delete({
        where: { id },
    });
    return formatBusinessResponse(result);
};

export const BusinessService = {
    createBusinessService,
    getAllBusinessesService,
    getBusinessByIdService,
    updateBusinessService,
    deleteBusinessService,
};
