import express from "express";
import { BranchManagerController } from "./branchManager.controller.js";
import validateRequest from "../../../middleware/validateRequest.js";
import { BranchManagerValidation } from "./branchManager.validation.js";
import { checkAuthMiddleware } from "../../../middleware/checkAuthMiddleware.js";
import { Role } from "../../../utils/role.js";

const router = express.Router();

router.post(
    "/create",
    checkAuthMiddleware(Role.BUSINESS_OWNER),
    validateRequest(BranchManagerValidation.createBranchManagerSchema),
    BranchManagerController.createBranchManager
);

router.get(
    "/all",
    checkAuthMiddleware(Role.BUSINESS_OWNER),
    BranchManagerController.getAllBranchManagers
);

router.get(
    "/:id",
    checkAuthMiddleware(Role.BUSINESS_OWNER),
    BranchManagerController.getBranchManagerById
);

router.patch(
    "/:id",
    checkAuthMiddleware(Role.BUSINESS_OWNER),
    validateRequest(BranchManagerValidation.updateBranchManagerSchema),
    BranchManagerController.updateBranchManager
);

router.delete(
    "/:id",
    checkAuthMiddleware(Role.BUSINESS_OWNER),
    BranchManagerController.deleteBranchManager
);

export const BranchManagerRoutes = router;
