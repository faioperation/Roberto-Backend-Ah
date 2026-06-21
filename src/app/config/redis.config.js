import { createClient } from "redis";
import { envVars } from "./env.js";


export const redisClient = createClient({
  url: envVars.REDIS_URL,
});

redisClient.on("error", (err) => console.log("Redis Client Error", err));

export const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log("✈️ Redis is connected");

    try {
      await redisClient.configSet("maxmemory-policy", "noeviction");
      console.log("✈️ Redis eviction policy configured to 'noeviction' successfully.");
    } catch (error) {
      console.log("⚠️ Failed to set Redis eviction policy programmatically (expected on some cloud providers):", error.message);
    }
  }
};