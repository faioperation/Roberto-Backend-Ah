import express from "express";
import { handleVapiWebhook } from "./vapi.controller.js";

const router = express.Router();

// Webhook endpoint: POST /webhook/vapi
router.post("/vapi", handleVapiWebhook);

export const VapiRoutes = router;
