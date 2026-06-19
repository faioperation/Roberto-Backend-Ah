import express from "express";
import { ParcelDeliveryController } from "./parcelDelivery.controller.js";
import validateRequest from "../../../middleware/validateRequest.js";
import { ParcelDeliveryValidation } from "./parcelDelivery.validation.js";
import { checkAuthMiddleware } from "../../../middleware/checkAuthMiddleware.js";
import { Role } from "../../../utils/role.js";

const router = express.Router();

router.post(
    "/create",
    checkAuthMiddleware(Role.BUSINESS_OWNER),
    validateRequest(ParcelDeliveryValidation.createParcelDeliverySchema),
    ParcelDeliveryController.createParcelDelivery
);

router.get(
    "/all",
    checkAuthMiddleware(Role.BUSINESS_OWNER),
    ParcelDeliveryController.getAllParcelDeliveries
);

router.get(
    "/:id",
    checkAuthMiddleware(Role.BUSINESS_OWNER),
    ParcelDeliveryController.getParcelDeliveryById
);

router.patch(
    "/:id",
    checkAuthMiddleware(Role.BUSINESS_OWNER),
    validateRequest(ParcelDeliveryValidation.updateParcelDeliverySchema),
    ParcelDeliveryController.updateParcelDelivery
);

router.delete(
    "/:id",
    checkAuthMiddleware(Role.BUSINESS_OWNER),
    ParcelDeliveryController.deleteParcelDelivery
);

export const ParcelDeliveryRoutes = router;
