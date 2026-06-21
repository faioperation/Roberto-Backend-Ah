import { Worker } from "bullmq";
import { redisConnection } from "./campaign.queue.js";
import { CampaignService } from "./campaign.service.js";

export const startCampaignWorker = () => {
  const worker = new Worker(
    "campaign-queue",
    async (job) => {
      console.log(`👷 Worker picked up job ${job.id}: ${job.name}`);
      if (job.name === "send-campaign") {
        const { campaignId } = job.data;
        await CampaignService.processSingleCampaign(campaignId);
      }
    },
    {
      connection: redisConnection,
      concurrency: 5,
    }
  );

  worker.on("completed", (job) => {
    console.log(`✅ Job ${job.id} has completed!`);
  });

  worker.on("failed", (job, err) => {
    console.error(`❌ Job ${job.id} has failed with ${err.message}`);
  });

  console.log("✈️ Campaign BullMQ Worker started successfully");
  return worker;
};
