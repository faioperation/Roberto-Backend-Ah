import prisma from "../../../prisma/client.js";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../../utils/sendResponse.js";
import { AppError } from "../../../errorHelper/appError.js";

export const createBooking = async (req, res, next) => {
  try {
    const {
      businessId,
      branchId,
      customerName,
      customerNumber,
      email,
      address,
      deliveryFromAddress,
      productName,
      quantity,
      size,
      price,
      shippingCharge,
      deliveryTime,
      orderNote,
      paymentMethod,
    } = req.body;

    // Validate required fields
    const requiredFields = {
      businessId,
      customerName,
      customerNumber,
      address,
      deliveryFromAddress,
      productName,
      quantity,
      size,
      price,
    };

    for (const [key, value] of Object.entries(requiredFields)) {
      if (!value) {
        throw new AppError(StatusCodes.BAD_REQUEST, `${key} is required.`);
      }
    }

    // Verify if business exists
    const businessExists = await prisma.business.findUnique({
      where: { id: businessId }
    });

    if (!businessExists) {
      throw new AppError(StatusCodes.NOT_FOUND, `Business with ID ${businessId} not found.`);
    }

    if (branchId) {
      const branchExists = await prisma.branch.findFirst({
        where: { id: branchId, businessId }
      });
      if (!branchExists) {
        throw new AppError(StatusCodes.NOT_FOUND, `Branch with ID ${branchId} not found in this business.`);
      }
    }

    // Create the order booking
    const newBooking = await prisma.orderBooking.create({
      data: {
        businessId,
        branchId: branchId || null,
        customerName,
        customerNumber,
        email: email || null,
        address,
        deliveryFromAddress,
        productName,
        quantity: String(quantity),
        size: String(size),
        price: String(price),
        shippingCharge: shippingCharge ? String(shippingCharge) : "0",
        deliveryTime: deliveryTime ? new Date(deliveryTime) : new Date(),
        orderNote: orderNote || null,
        paymentMethod: paymentMethod || "CASH_ON_DELIVERY",
      }
    });

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: "Order booking created successfully.",
      data: newBooking
    });
  } catch (error) {
    next(error);
  }
};
