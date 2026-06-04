import prisma from "../../../prisma/client.js";
import DevBuildError from "../../../lib/DevBuildError.js";
import { StatusCodes } from "http-status-codes";
import { QueryBuilder } from "../../../utils/QueryBuilder.js";

const createCrmLeadService = async (payload) => {
    const result = await prisma.crmLead.create({
        data: payload,
    });
    return result;
};

const getAllCrmLeadsService = async (query = {}, filter = {}) => {
    const queryBuilder = new QueryBuilder(query)
        .search(["name", "email", "phone"])
        .filter()
        .sort()
        .paginate()
        .fields();

    const queryParams = queryBuilder.build();
    queryParams.where = { ...queryParams.where, ...filter };

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
            branch: {
                select: {
                    id: true,
                    name: true
                }
            }
        };
    }

    const result = await prisma.crmLead.findMany(queryParams);
    const total = await prisma.crmLead.count({ where: queryParams.where });

    return {
        meta: queryBuilder.getMeta(total),
        data: result,
    };
};

const getCrmLeadByIdService = async (id, filter = {}, query = {}) => {
    const queryBuilder = new QueryBuilder(query).fields();
    const queryParams = queryBuilder.build();

    const findArgs = {
        where: { id, ...filter },
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
            branch: {
                select: {
                    id: true,
                    name: true
                }
            }
        };
    }

    const result = await prisma.crmLead.findUnique(findArgs);
    
    if (!result) {
        throw new DevBuildError("CRM Lead not found", StatusCodes.NOT_FOUND);
    }

    return result;
};

const updateCrmLeadService = async (id, filter, payload) => {
    const isExist = await prisma.crmLead.findUnique({
        where: { id, ...filter },
    });

    if (!isExist) {
        throw new DevBuildError("CRM Lead not found or you don't have access", StatusCodes.NOT_FOUND);
    }

    const result = await prisma.crmLead.update({
        where: { id },
        data: payload,
    });
    
    return result;
};

const deleteCrmLeadService = async (id, filter) => {
    const isExist = await prisma.crmLead.findUnique({
        where: { id, ...filter },
    });

    if (!isExist) {
        throw new DevBuildError("CRM Lead not found or you don't have access", StatusCodes.NOT_FOUND);
    }

    const result = await prisma.crmLead.delete({
        where: { id },
    });
    
    return result;
};

export const CrmLeadsManagerService = {
    createCrmLeadService,
    getAllCrmLeadsService,
    getCrmLeadByIdService,
    updateCrmLeadService,
    deleteCrmLeadService,
};
