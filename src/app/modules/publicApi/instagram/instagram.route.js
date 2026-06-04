import express from "express";
import { sendInstagramMessage } from "./instagram.controller.js";
import { publicApiAuth } from "../../../middleware/publicApiAuth.js";

const router = express.Router();

router.post("/messages/send", publicApiAuth, sendInstagramMessage);

export const PublicInstagramRoutes = router;
