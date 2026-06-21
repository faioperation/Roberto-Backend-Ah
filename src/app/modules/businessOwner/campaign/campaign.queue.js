import { Queue } from "bullmq";
import { envVars } from "../../../config/env.js";

const redisUrl = new URL(envVars.REDIS_URL);
export const redisConnection = {
  host: redisUrl.hostname,
  port: Number(redisUrl.port) || 6379,
  username: redisUrl.username || undefined,
  password: redisUrl.password || undefined,
  tls: redisUrl.protocol === "rediss:" ? {} : undefined,
};

export const campaignQueue = new Queue("campaign-queue", {
  connection: redisConnection,
});
