import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../../utils/sendResponse.js";
import { BusinessService } from "../../systemOwner/businessManagement/businessManagement.service.js";
import jwt from "jsonwebtoken";
import prisma from "../../../prisma/client.js";
import { envVars } from "../../../config/env.js";

const createBusiness = async (req, res, next) => {
    try {
        const payload = req.body;
        let isSystemOwner = false;
        let creatorUserId = null;

        // Parse Authorization header optionally to check if the creator is a SYSTEM_OWNER
        if (req.headers.authorization) {
            try {
                const token = req.headers.authorization.replace(/^Bearer\s*/i, "");
                const decoded = jwt.verify(token, envVars.JWT_SECRET_TOKEN);
                const creatorUser = await prisma.user.findUnique({
                    where: { id: decoded.id },
                    include: { roles: { include: { role: true } } }
                });
                if (creatorUser) {
                    creatorUserId = creatorUser.id;
                    isSystemOwner = creatorUser.roles?.some(r => r.role.name === "SYSTEM_OWNER") || false;
                }
            } catch (err) {
                // Ignore token errors since authentication is optional for creation
            }
        }

        // if logged in user is creating it, we can set createdById
        if (req.user && req.user.id) {
            payload.createdById = req.user.id;
        } else if (creatorUserId) {
            payload.createdById = creatorUserId;
        }

        payload.isSystemOwner = isSystemOwner;

        // Force the business status to PENDING for the public creation API
        payload.status = "PENDING";

        const result = await BusinessService.createBusinessService(payload);

        sendResponse(res, {
            success: true,
            message: "Business created successfully",
            statusCode: StatusCodes.CREATED,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const GlobalBusinessController = {
    createBusiness,
};
