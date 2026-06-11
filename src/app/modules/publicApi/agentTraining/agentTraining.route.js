import express from "express";
import { getAgentTraining } from "./agentTraining.controller.js";
import { publicApiAuth } from "../../../middleware/publicApiAuth.js";

const router = express.Router();

router.get("/", publicApiAuth, getAgentTraining);
router.get("/:businessId", publicApiAuth, getAgentTraining);

export const PublicAgentTrainingRoutes = router;
