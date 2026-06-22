import dotenv from "dotenv";
dotenv.config();

const loadEnvVars = () => {
  const requiredVars = [
    "PORT",
    "NODE_ENV",

    "JWT_SECRET_TOKEN",
    "JWT_REFRESH_TOKEN",
    "JWT_EXPIRES_IN",
    "JWT_REFRESH_EXPIRES_IN",

    "DATABASE_URL",
    "BACKEND_URL",
    "REDIS_URL",
    "META_APP_ID",
    "META_APP_SECRET",
    "FACEBOOK_REDIRECT_URI",
    "FACEBOOK_VERIFY_TOKEN",
    "WHATSAPP_VERIFY_TOKEN",
    "INSTAGRAM_REDIRECT_URI",
    "INSTAGRAM_VERIFY_TOKEN",

    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
  ];

  requiredVars.forEach((key) => {
    if (!process.env[key]) {
      throw new Error(`❌ Missing environment variable: ${key}`);
    }
  });

  return {
    // App
    PORT: Number(process.env.PORT),
    NODE_ENV: process.env.NODE_ENV,

    // JWT
    JWT_SECRET_TOKEN: process.env.JWT_SECRET_TOKEN,
    JWT_REFRESH_TOKEN: process.env.JWT_REFRESH_TOKEN,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN,

    // Database
    DATABASE_URL: process.env.DATABASE_URL,

    BACKEND_URL: process.env.BACKEND_URL,

    // Redis
    REDIS_URL: process.env.REDIS_URL,
    // node mailer (SMTP)
    EMAIL_SENDER: {
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PASS: process.env.SMTP_PASS,
      SMTP_FROM: process.env.SMTP_FROM,
    },
    // Google OAuth
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
    // Frontend
    FRONT_END_URL: process.env.FRONT_END_URL,
    
    // Facebook & Messenger Integration
    META_APP_ID: process.env.META_APP_ID,
    META_APP_SECRET: process.env.META_APP_SECRET,
    META_GRAPH_VERSION: process.env.META_GRAPH_VERSION || "v23.0",
    FACEBOOK_REDIRECT_URI: process.env.FACEBOOK_REDIRECT_URI,
    FACEBOOK_VERIFY_TOKEN: process.env.FACEBOOK_VERIFY_TOKEN,
    // WhatsApp Integration
    WHATSAPP_VERIFY_TOKEN: process.env.WHATSAPP_VERIFY_TOKEN,

    // Instagram Integration
    INSTAGRAM_REDIRECT_URI: process.env.INSTAGRAM_REDIRECT_URI,
    INSTAGRAM_VERIFY_TOKEN: process.env.INSTAGRAM_VERIFY_TOKEN,
    PUBLIC_API_TOKEN: process.env.PUBLIC_API_TOKEN,

    // Stripe
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_CONNECT_MONTHLY_PRICE_ID: process.env.STRIPE_CONNECT_MONTHLY_PRICE_ID,
    STRIPE_CONNECT_YEARLY_PRICE_ID: process.env.STRIPE_CONNECT_YEARLY_PRICE_ID,
    STRIPE_CONVERT_MONTHLY_PRICE_ID: process.env.STRIPE_CONVERT_MONTHLY_PRICE_ID,
    STRIPE_CONVERT_YEARLY_PRICE_ID: process.env.STRIPE_CONVERT_YEARLY_PRICE_ID,
    STRIPE_CONTROL_MONTHLY_PRICE_ID: process.env.STRIPE_CONTROL_MONTHLY_PRICE_ID,
    STRIPE_CONTROL_YEARLY_PRICE_ID: process.env.STRIPE_CONTROL_YEARLY_PRICE_ID,

    // AI Agent Integration
    AI_API_TAREQ: process.env.AI_API_TAREQ,
    AI_AGENT_API_TOKEN: process.env.AI_AGENT_API_TOKEN,
    VOICE_AGENT_API: process.env.VOICE_AGENT_API,
    VAPI_API_KEY: process.env.VAPI_API_KEY,

    // Firebase Cloud Messaging
    FIREBASE_SERVICE_ACCOUNT_PATH: process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
  };
};

export const envVars = loadEnvVars();
