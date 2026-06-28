import { sendResponse } from "../../utils/sendResponse.js";
import { StatusCodes } from "http-status-codes";
import { PricingCalculatorService } from "./pricingCalculator.service.js";

const calculatePricing = async (req, res, next) => {
    try {
        const result = await PricingCalculatorService.calculatePrice(req.query);
        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Pricing calculated successfully",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const PricingCalculatorController = {
    calculatePricing,
};
