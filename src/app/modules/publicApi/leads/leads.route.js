import express from "express";
import { createLead } from "./leads.controller.js";
import { publicApiAuth } from "../../../middleware/publicApiAuth.js";

const router = express.Router();

router.post("/create", publicApiAuth, createLead);

export const PublicLeadRoutes = router;
