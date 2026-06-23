import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { notFound } from "./app/middleware/notFound.js";
import { globalErrorHandler } from "./app/middleware/globalErrorHandeler.js";
import { router } from "./app/router/index.js";
import passport from "passport";
import "./app/config/passport.config.js";



dotenv.config();

const app = express();

// Global middlewares
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5174",
  "https://matrix-ai-app.vercel.app",
  "https://matrix-ai-landing-page.vercel.app/"
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, postman, curl)
    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.includes(origin) ||
      /^http:\/\/localhost:\d+$/.test(origin) ||
      /\.ngrok-free\.dev$/.test(origin) ||
      /\.ngrok\.app$/.test(origin);

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));
app.use(cookieParser());
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString("utf8");
  }
}));
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Routes
app.use("/api", router);
app.use("/uploads", express.static("uploads"));

// Health check
app.get("/", (req, res) => {
  res.send("Robarto Backend is running > >> ✅🚀");
});

// 404 handler (must be after routes)
app.use(notFound);

// Global error handler (always last)
app.use(globalErrorHandler);

export default app;


