import express from "express";
import { upsertChatSummary } from "./chatSummary.controller.js";
import { publicApiAuth } from "../../../middleware/publicApiAuth.js";

const router = express.Router();

router.post("/upsert", publicApiAuth, upsertChatSummary);

export const PublicChatSummaryRoutes = router;
