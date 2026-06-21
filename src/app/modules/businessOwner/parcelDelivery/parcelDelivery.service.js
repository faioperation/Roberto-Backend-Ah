import prisma from "../../../prisma/client.js";
import DevBuildError from "../../../lib/DevBuildError.js";
import { StatusCodes } from "http-status-codes";
import { QueryBuilder } from "../../../utils/QueryBuilder.js";

const buildMainPayload = (businessId, payload) => {
    const extracted = {};
    const fields = ["branchId", "createdById", "customerName", "customerNumber", "email", "note", "status"];
    for (const f of fields) {
        if (payload[f] !== undefined) extracted[f] = payload[f];
    }
    if (payload.price !== undefined) extracted.price = String(payload.price);
    extracted.businessId = businessId;
    return extracted;
};

const createParcelDeliveryService = async (payload) => {
    const mainPayload = buildMainPayload(payload.businessId, payload);

    const detailsData = {
        pickupAddress: payload.pickupAddress || null,
        deliveryDate: payload.deliveryDate || null,
        deliveryAddress: payload.deliveryAddress || null,
        productType: payload.productType || null,
        productHeight: payload.productHeight || null,
        productWeight: (() => {
            const w = payload.productWeight;
            if (w === undefined || w === null || w === "") return null;
            const parsed = parseInt(w, 10);
            return isNaN(parsed) ? null : parsed;
        })(),
    };

    const result = await prisma.$transaction(async (tx) => {
        const parcel = await tx.parcelDelivery.create({ data: mainPayload });

        await tx.parcelDetails.create({
            data: {
                businessId: parcel.businessId,
                branchId: parcel.branchId,
                parcelDeliveryId: parcel.id,
                ...detailsData,
            }
        });

        if (payload.paymentStatus || payload.paymentMethod || payload.transactionId) {
            await tx.paymentDetail.create({
                data: {
                    referenceId: parcel.id,
                    createdById: mainPayload.createdById || null,
                    paymentStatus: payload.paymentStatus || "PENDING",
                    paymentMethod: payload.paymentMethod || null,
                    transactionId: payload.transactionId || null,
                }
            });
        }

        return await tx.parcelDelivery.findUnique({
            where: { id: parcel.id },
            include: { parcelDetails: true }
        });
    });

    return result;
};

const getAllParcelDeliveriesService = async (query = {}) => {
    const queryBuilder = new QueryBuilder(query)
        .search(["customerName", "customerNumber", "email"])
        .filter()
        .sort()
        .paginate()
        .fields();

    const queryParams = queryBuilder.build();

    if (!queryParams.select) {
        queryParams.include = {
            parcelDetails: true,
            createdBy: {
                select: { id: true, email: true, firstName: true, lastName: true }
            }
        };
    }

    const [result, total] = await Promise.all([
        prisma.parcelDelivery.findMany(queryParams),
        prisma.parcelDelivery.count({ where: queryParams.where }),
    ]);

    return { meta: { ...queryBuilder.getMeta(total), totalParcels: total }, data: result };
};

const getParcelDeliveryByIdService = async (id, query = {}) => {
    const queryBuilder = new QueryBuilder(query).fields();
    const queryParams = queryBuilder.build();
    const findArgs = { where: { id } };

    if (queryParams.select) {
        findArgs.select = queryParams.select;
    } else {
        findArgs.include = {
            parcelDetails: true,
            createdBy: {
                select: { id: true, email: true, firstName: true, lastName: true }
            }
        };
    }

    const result = await prisma.parcelDelivery.findUnique(findArgs);
    if (!result) throw new DevBuildError("Parcel Delivery not found", StatusCodes.NOT_FOUND);
    return result;
};

const updateParcelDeliveryService = async (id, payload) => {
    const isExist = await prisma.parcelDelivery.findUnique({ where: { id } });
    if (!isExist) throw new DevBuildError("Parcel Delivery not found", StatusCodes.NOT_FOUND);

    const mainPayload = buildMainPayload(isExist.businessId, payload);
    const { userId } = payload;

    const detailsData = {};
    if (payload.pickupAddress !== undefined) detailsData.pickupAddress = payload.pickupAddress;
    if (payload.deliveryDate !== undefined) detailsData.deliveryDate = payload.deliveryDate;
    if (payload.deliveryAddress !== undefined) detailsData.deliveryAddress = payload.deliveryAddress;
    if (payload.productType !== undefined) detailsData.productType = payload.productType;
    if (payload.productHeight !== undefined) detailsData.productHeight = payload.productHeight;
    if (payload.productWeight !== undefined) {
        const w = payload.productWeight;
        if (w === null || w === "") {
            detailsData.productWeight = null;
        } else {
            const parsed = parseInt(w, 10);
            detailsData.productWeight = isNaN(parsed) ? null : parsed;
        }
    }

    const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.parcelDelivery.update({ where: { id }, data: mainPayload });

        if (Object.keys(detailsData).length > 0) {
            await tx.parcelDetails.upsert({
                where: { parcelDeliveryId: id },
                update: detailsData,
                create: {
                    businessId: updated.businessId,
                    branchId: updated.branchId,
                    parcelDeliveryId: id,
                    ...detailsData,
                }
            });
        }

        await tx.auditLog.create({
            data: {
                businessId: updated.businessId,
                userId: userId || null,
                action: "UPDATE",
                targetTable: "ParcelDelivery",
                targetId: id,
                oldValues: { note: isExist.note, price: isExist.price },
                newValues: { note: updated.note, price: updated.price }
            }
        });

        return await tx.parcelDelivery.findUnique({
            where: { id },
            include: { parcelDetails: true }
        });
    });

    return result;
};

const deleteParcelDeliveryService = async (id) => {
    const isExist = await prisma.parcelDelivery.findUnique({ where: { id } });
    if (!isExist) throw new DevBuildError("Parcel Delivery not found", StatusCodes.NOT_FOUND);
    return await prisma.parcelDelivery.delete({ where: { id } });
};

export const ParcelDeliveryService = {
    createParcelDeliveryService,
    getAllParcelDeliveriesService,
    getParcelDeliveryByIdService,
    updateParcelDeliveryService,
    deleteParcelDeliveryService,
};
