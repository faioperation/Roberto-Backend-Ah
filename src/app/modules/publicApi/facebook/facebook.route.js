import express from "express";
import { sendFacebookMessage } from "./facebook.controller.js";
import { publicApiAuth } from "../../../middleware/publicApiAuth.js";

const router = express.Router();

router.post("/messages/send", publicApiAuth, sendFacebookMessage);

export const PublicFacebookRoutes = router;
