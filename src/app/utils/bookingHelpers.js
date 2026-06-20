import prisma from "../prisma/client.js";

/**
 * Safely parses a date value, returning null if it's invalid
 */
const parseSafeDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (isNaN(date.getTime())) {
        return null;
    }
    return date;
};

/**
 * Returns the correct Prisma model config based on businessType.
 */
export const getBookingModel = (businessType) => {
    if (businessType === "APPOINTMENT_BOOKING") {
        return {
            model: prisma.appointmentBooking,
            detailsModel: prisma.appointmentDetails,
            detailsKey: "appointmentId",
            detailsRelation: "appointmentDetails",
        };
    }
    if (businessType === "PARCEL_DELIVERY") {
        return {
            model: prisma.parcelDelivery,
            detailsModel: prisma.parcelDetails,
            detailsKey: "parcelDeliveryId",
            detailsRelation: "parcelDetails",
        };
    }
    // Default: ORDER_BOOKING
    return {
        model: prisma.orderBooking,
        detailsModel: prisma.orderDetails,
        detailsKey: "orderId",
        detailsRelation: "orderDetails",
    };
};

/**
 * Builds the main booking payload (common fields).
 */
export const buildMainPayload = (businessId, payload) => {
    const extracted = { businessId };
    const fields = ["branchId", "createdById", "customerName", "customerNumber", "email", "note", "status"];
    for (const f of fields) {
        if (payload[f] !== undefined) extracted[f] = payload[f];
    }
    if (payload.price !== undefined) extracted.price = String(payload.price);
    return extracted;
};

/**
 * Builds the details payload based on businessType.
 */
export const buildDetailsPayload = (businessType, payload, bookingId, businessId, branchId) => {
    if (businessType === "APPOINTMENT_BOOKING") {
        const rawTime = payload.appointmentTime || payload.appointment_time;
        return {
            businessId,
            branchId: branchId || null,
            appointmentId: bookingId,
            appointmentDate: payload.appointmentDate || payload.appointment_date || null,
            appointmentTime: parseSafeDate(rawTime),
            platform: payload.platform || null,
            duration: payload.duration || null,
        };
    }
    if (businessType === "PARCEL_DELIVERY") {
        return {
            businessId,
            branchId: branchId || null,
            parcelDeliveryId: bookingId,
            pickupAddress: payload.pickupAddress || payload.pickup_address || null,
            deliveryDate: payload.deliveryDate || payload.delivery_date || null,
            deliveryAddress: payload.deliveryAddress || payload.delivery_address || null,
            productType: payload.productType || payload.product_type || null,
            productHeight: payload.productHeight || payload.product_height || null,
            productWeight: payload.productWeight || payload.product_weight || null,
        };
    }
    // Default: ORDER_BOOKING
    return {
        businessId,
        branchId: branchId || null,
        orderId: bookingId,
        deliveryDate: payload.deliveryDate || payload.delivery_date || null,
        deliveryAddress: payload.deliveryAddress || payload.delivery_address || null,
        productType: payload.productType || payload.product_type || null,
    };
};

/**
 * Builds partial details payload for update (only provided fields).
 */
export const buildDetailsUpdatePayload = (businessType, payload) => {
    const data = {};
    if (businessType === "APPOINTMENT_BOOKING") {
        const rawTime = payload.appointmentTime || payload.appointment_time;
        if (payload.appointmentDate !== undefined || payload.appointment_date !== undefined) {
            data.appointmentDate = payload.appointmentDate || payload.appointment_date;
        }
        if (payload.appointmentTime !== undefined || payload.appointment_time !== undefined) {
            data.appointmentTime = parseSafeDate(rawTime);
        }
        if (payload.platform !== undefined) data.platform = payload.platform;
        if (payload.duration !== undefined) data.duration = payload.duration;
    } else if (businessType === "PARCEL_DELIVERY") {
        if (payload.pickupAddress !== undefined) data.pickupAddress = payload.pickupAddress;
        if (payload.deliveryDate !== undefined) data.deliveryDate = payload.deliveryDate;
        if (payload.deliveryAddress !== undefined) data.deliveryAddress = payload.deliveryAddress;
        if (payload.productType !== undefined) data.productType = payload.productType;
        if (payload.productHeight !== undefined) data.productHeight = payload.productHeight;
        if (payload.productWeight !== undefined) data.productWeight = payload.productWeight;
    } else {
        if (payload.deliveryDate !== undefined) data.deliveryDate = payload.deliveryDate;
        if (payload.deliveryAddress !== undefined) data.deliveryAddress = payload.deliveryAddress;
        if (payload.productType !== undefined) data.productType = payload.productType;
    }
    return data;
};

/**
 * Extracts and saves any non-standard/additional fields from booking payload.
 */
export const saveAdditionalDetails = async (tx, businessId, branchId, bookingId, payload) => {
    const standardFields = new Set([
        "businessId",
        "branchId",
        "createdById",
        "customerName",
        "customerNumber",
        "email",
        "note",
        "price",
        "businessType",
        "paymentStatus",
        "paymentMethod",
        "transactionId",
        "paymentDetails",
        "deliveryDate",
        "deliveryAddress",
        "productType",
        "appointmentDate",
        "appointmentTime",
        "platform",
        "duration",
        "pickupAddress",
        "productHeight",
        "productWeight",
        "userId",
        "status"
    ]);

    const additionalDetailsData = [];
    for (const key of Object.keys(payload)) {
        if (!standardFields.has(key) && payload[key] !== undefined && payload[key] !== null) {
            const val = typeof payload[key] === 'object' ? JSON.stringify(payload[key]) : String(payload[key]);
            additionalDetailsData.push({
                businessId,
                branchId: branchId || null,
                referenceId: bookingId,
                key,
                value: val,
            });
        }
    }

    if (additionalDetailsData.length > 0) {
        await tx.additionalDetail.createMany({
            data: additionalDetailsData
        });
    }
};

/**
 * Updates or creates additional detail fields.
 */
export const updateAdditionalDetails = async (tx, businessId, branchId, bookingId, payload) => {
    const standardFields = new Set([
        "businessId",
        "branchId",
        "createdById",
        "customerName",
        "customerNumber",
        "email",
        "note",
        "price",
        "businessType",
        "paymentStatus",
        "paymentMethod",
        "transactionId",
        "paymentDetails",
        "deliveryDate",
        "deliveryAddress",
        "productType",
        "appointmentDate",
        "appointmentTime",
        "platform",
        "duration",
        "pickupAddress",
        "productHeight",
        "productWeight",
        "userId",
        "status"
    ]);

    for (const key of Object.keys(payload)) {
        if (!standardFields.has(key) && payload[key] !== undefined) {
            const value = payload[key];
            const val = typeof value === 'object' ? JSON.stringify(value) : String(value);

            const existingDetail = await tx.additionalDetail.findFirst({
                where: { referenceId: bookingId, key }
            });

            if (existingDetail) {
                if (value === null) {
                    await tx.additionalDetail.delete({ where: { id: existingDetail.id } });
                } else {
                    await tx.additionalDetail.update({
                        where: { id: existingDetail.id },
                        data: { value: val }
                    });
                }
            } else if (value !== null) {
                await tx.additionalDetail.create({
                    data: {
                        businessId,
                        branchId: branchId || null,
                        referenceId: bookingId,
                        key,
                        value: val
                    }
                });
            }
        }
    }
};

/**
 * Fetches and attaches paymentDetail and additionalDetails to the booking(s).
 */
export const attachDetails = async (txOrPrisma, bookings) => {
    const isArray = Array.isArray(bookings);
    const list = isArray ? bookings : [bookings];
    if (list.length === 0) return bookings;

    const bookingIds = list.map(b => b.id);
    const [allPaymentDetails, allAdditionalDetails] = await Promise.all([
        txOrPrisma.paymentDetail.findMany({ where: { referenceId: { in: bookingIds } } }),
        txOrPrisma.additionalDetail.findMany({ where: { referenceId: { in: bookingIds } } }),
    ]);

    const paymentMap = {};
    for (const pd of allPaymentDetails) {
        paymentMap[pd.referenceId] = pd;
    }
    const additionalMap = {};
    for (const ad of allAdditionalDetails) {
        if (!additionalMap[ad.referenceId]) {
            additionalMap[ad.referenceId] = [];
        }
        additionalMap[ad.referenceId].push(ad);
    }

    const formatted = list.map(booking => ({
        ...booking,
        paymentDetails: paymentMap[booking.id] || null,
        additionalDetails: additionalMap[booking.id] || [],
    }));

    return isArray ? formatted : formatted[0];
};

