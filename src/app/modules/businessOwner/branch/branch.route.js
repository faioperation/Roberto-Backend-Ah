import express from "express";
import { BranchController } from "./branch.controller.js";
import validateRequest from "../../../middleware/validateRequest.js";
import { BranchValidation } from "./branch.validation.js";
import { checkAuthMiddleware } from "../../../middleware/checkAuthMiddleware.js";
import { Role } from "../../../utils/role.js";

const router = express.Router();

router.post(
    "/create",
    checkAuthMiddleware(Role.BUSINESS_OWNER),
    validateRequest(BranchValidation.createBranchSchema),
    BranchController.createBranch
);

router.get(
    "/all",
    checkAuthMiddleware(Role.BUSINESS_OWNER),
    BranchController.getAllBranches
);

router.get(
    "/:id",
    checkAuthMiddleware(Role.BUSINESS_OWNER),
    BranchController.getBranchById
);

router.patch(
    "/:id",
    checkAuthMiddleware(Role.BUSINESS_OWNER),
    validateRequest(BranchValidation.updateBranchSchema),
    BranchController.updateBranch
);

router.delete(
    "/:id",
    checkAuthMiddleware(Role.BUSINESS_OWNER),
    BranchController.deleteBranch
);

export const BranchRoutes = router;
