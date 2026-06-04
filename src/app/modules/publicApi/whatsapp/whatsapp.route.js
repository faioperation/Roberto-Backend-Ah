import express from "express";
import { sendWhatsappMessage } from "./whatsapp.controller.js";
import { publicApiAuth } from "../../../middleware/publicApiAuth.js";

const router = express.Router();

router.post("/messages/send", publicApiAuth, sendWhatsappMessage);

export const PublicWhatsappRoutes = router;
