import prisma from "../../prisma/client.js";
import DevBuildError from "../../lib/DevBuildError.js";
import { StatusCodes } from "http-status-codes";

const calculatePrice = async (query) => {
    const { pricingId, weight, distance, serviceType, selectedExtras, quantity } = query;

    if (!pricingId) {
        throw new DevBuildError("pricingId is required", StatusCodes.BAD_REQUEST);
    }

    const pricing = await prisma.pricing.findUnique({
        where: { id: pricingId },
    });

    if (!pricing) {
        throw new DevBuildError("Pricing rule not found", StatusCodes.NOT_FOUND);
    }

    const config = pricing.configuration;
    if (!config || typeof config !== "object") {
        throw new DevBuildError("Invalid pricing configuration", StatusCodes.BAD_REQUEST);
    }

    const {
        minimumCharge = 0,
        weight: weightConf,
        distance: distanceConf,
        serviceTypes: serviceConf,
        additionalCharges: additionalConf,
        tax: taxConf
    } = config;

    const parsedWeight = parseFloat(weight) || 0;
    const parsedDistance = parseFloat(distance) || 0;
    const resolvedServiceType = serviceType || "standard";
    const parsedQuantity = parseInt(quantity, 10) || 1;

    // Parse selectedExtras (could be an array or a comma-separated string)
    let extrasList = [];
    if (selectedExtras) {
        if (Array.isArray(selectedExtras)) {
            extrasList = selectedExtras;
        } else if (typeof selectedExtras === "string") {
            extrasList = selectedExtras.split(",").map(e => e.trim());
        }
    }

    // 1. Weight Cost
    let weightCost = 0;
    if (weightConf?.enabled) {
        weightCost = parsedWeight * (weightConf.rate || 0);
    }

    // 2. Distance Cost
    let distanceCost = 0;
    if (distanceConf?.enabled) {
        distanceCost = parsedDistance * (distanceConf.rate || 0);
    }

    // 3. Base & Service Cost
    const baseCost = weightCost + distanceCost;
    const multiplier = serviceConf?.[resolvedServiceType]?.multiplier || 1;
    const serviceCost = baseCost * multiplier;

    // 4. Minimum Charge Check
    const costBeforeExtras = Math.max(serviceCost, minimumCharge);

    // 5. Additional Charges
    let extrasCost = 0;
    const appliedExtras = {};
    if (additionalConf) {
        extrasList.forEach((extraKey) => {
            if (additionalConf[extraKey] !== undefined) {
                extrasCost += additionalConf[extraKey];
                appliedExtras[extraKey] = additionalConf[extraKey];
            }
        });
    }

    const totalBeforeTax = costBeforeExtras + extrasCost;

    // 6. Tax Calculation
    let taxCost = 0;
    if (taxConf?.enabled) {
        taxCost = totalBeforeTax * ((taxConf.percentage || 0) / 100);
    }

    // 7. Final output calculation
    const unitPrice = totalBeforeTax + taxCost;
    const finalPrice = unitPrice * parsedQuantity;

    return {
        ruleName: pricing.ruleName,
        type: pricing.type,
        currency: config.currency || "USD",
        breakdown: {
            weightCost,
            distanceCost,
            baseCost,
            serviceCost,
            minimumChargeApplied: serviceCost < minimumCharge,
            extrasCost,
            appliedExtras,
            taxCost,
            unitPrice,
        },
        finalPrice: parseFloat(finalPrice.toFixed(2)),
        quantity: parsedQuantity
    };
};

export const PricingCalculatorService = {
    calculatePrice,
};
