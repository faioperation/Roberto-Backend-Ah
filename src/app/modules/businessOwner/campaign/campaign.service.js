import prisma from "../../../prisma/client.js";
import { QueryBuilder } from "../../../utils/QueryBuilder.js";
import DevBuildError from "../../../lib/DevBuildError.js";
import { StatusCodes } from "http-status-codes";
import { MetaGraphAPI } from "../../whatsapp/whatsapp.meta.js";
import { campaignQueue } from "./campaign.queue.js";

const formatCampaign = (campaign) => {
    if (!campaign) return campaign;
    const now = new Date();
    const isExpire = campaign.endDate ? now > new Date(campaign.endDate) : false;
    return {
        ...campaign,
        isExpire,
    };
};

const createCampaignService = async (businessId, payload) => {
    const { title, selectedPeople, message, branchId } = payload;
    const rawScheduledTime = payload.scheduledTime || payload.scheduled_time;
    const rawEndDate = payload.endDate || payload.end_date;

    const parsedTime = new Date(rawScheduledTime);
    if (isNaN(parsedTime.getTime())) {
        throw new DevBuildError("Invalid scheduledTime format", StatusCodes.BAD_REQUEST);
    }

    let parsedEndDate = null;
    if (rawEndDate) {
        parsedEndDate = new Date(rawEndDate);
        if (isNaN(parsedEndDate.getTime())) {
            throw new DevBuildError("Invalid endDate format", StatusCodes.BAD_REQUEST);
        }
    }

    const formattedPeople = Array.isArray(selectedPeople) ? selectedPeople : [selectedPeople];

    const campaign = await prisma.campaign.create({
        data: {
            businessId,
            branchId: branchId || null,
            title,
            selectedPeople: formattedPeople,
            scheduledTime: parsedTime,
            endDate: parsedEndDate,
            isExpire: parsedEndDate ? new Date() > parsedEndDate : false,
            message,
            status: "PENDING",
        },
    });

    // Schedule delayed job using BullMQ
    const delay = Math.max(0, parsedTime.getTime() - Date.now());
    await campaignQueue.add(
        "send-campaign",
        { campaignId: campaign.id },
        { jobId: `campaign-${campaign.id}`, delay }
    );

    return formatCampaign(campaign);
};

const getAllCampaignsService = async (businessId, query = {}) => {
    const queryBuilder = new QueryBuilder({ ...query, businessId })
        .search(["title"])
        .filter()
        .sort("-createdAt")
        .paginate()
        .fields();

    const queryParams = queryBuilder.build();

    const [result, total] = await Promise.all([
        prisma.campaign.findMany(queryParams),
        prisma.campaign.count({ where: queryParams.where }),
    ]);

    return {
        meta: queryBuilder.getMeta(total),
        data: result.map(formatCampaign),
    };
};

const getCampaignByIdService = async (businessId, id) => {
    const campaign = await prisma.campaign.findUnique({
        where: { id, businessId },
    });

    if (!campaign) {
        throw new DevBuildError("Campaign not found", StatusCodes.NOT_FOUND);
    }

    return formatCampaign(campaign);
};

const updateCampaignService = async (businessId, id, payload) => {
    const isExist = await prisma.campaign.findUnique({
        where: { id, businessId },
    });

    if (!isExist) {
        throw new DevBuildError("Campaign not found", StatusCodes.NOT_FOUND);
    }

    // Only allow updating if it is still pending
    if (isExist.status !== "PENDING") {
        throw new DevBuildError("Only pending campaigns can be updated", StatusCodes.BAD_REQUEST);
    }

    const updateData = { ...payload };
    
    const rawScheduledTime = payload.scheduledTime || payload.scheduled_time;
    if (rawScheduledTime) {
        const parsedTime = new Date(rawScheduledTime);
        if (isNaN(parsedTime.getTime())) {
            throw new DevBuildError("Invalid scheduledTime format", StatusCodes.BAD_REQUEST);
        }
        updateData.scheduledTime = parsedTime;
        delete updateData.scheduled_time;
    }

    const hasEndDateField = payload.endDate !== undefined || payload.end_date !== undefined;
    if (hasEndDateField) {
        const rawEndDate = payload.endDate !== undefined ? payload.endDate : payload.end_date;
        if (rawEndDate) {
            const parsedEndDate = new Date(rawEndDate);
            if (isNaN(parsedEndDate.getTime())) {
                throw new DevBuildError("Invalid endDate format", StatusCodes.BAD_REQUEST);
            }
            updateData.endDate = parsedEndDate;
            updateData.isExpire = new Date() > parsedEndDate;
        } else {
            updateData.endDate = null;
            updateData.isExpire = false;
        }
        delete updateData.end_date;
    }

    if (payload.selectedPeople) {
        updateData.selectedPeople = Array.isArray(payload.selectedPeople) ? payload.selectedPeople : [payload.selectedPeople];
    }

    const campaign = await prisma.campaign.update({
        where: { id },
        data: updateData,
    });

    // Reschedule in BullMQ queue
    const delay = Math.max(0, campaign.scheduledTime.getTime() - Date.now());
    const jobId = `campaign-${campaign.id}`;
    
    // Remove existing job if any
    const existingJob = await campaignQueue.getJob(jobId);
    if (existingJob) {
        await existingJob.remove();
    }
    
    // Add updated job
    await campaignQueue.add(
        "send-campaign",
        { campaignId: campaign.id },
        { jobId, delay }
    );

    return formatCampaign(campaign);
};

const deleteCampaignService = async (businessId, id) => {
    const isExist = await prisma.campaign.findUnique({
        where: { id, businessId },
    });

    if (!isExist) {
        throw new DevBuildError("Campaign not found", StatusCodes.NOT_FOUND);
    }

    const campaign = await prisma.campaign.delete({
        where: { id },
    });

    // Remove job from BullMQ queue
    const jobId = `campaign-${campaign.id}`;
    const existingJob = await campaignQueue.getJob(jobId);
    if (existingJob) {
        await existingJob.remove();
    }

    return campaign;
};

// ─────────────────────────────────────────────────────────────────────────────
// Process one single campaign (called by BullMQ Worker)
// ─────────────────────────────────────────────────────────────────────────────
const processSingleCampaign = async (campaignId) => {
    try {
        const campaign = await prisma.campaign.findUnique({
            where: { id: campaignId },
        });

        if (!campaign || campaign.status !== "PENDING") {
            return;
        }

        // Update campaign status to IN_PROGRESS so it's not picked up again
        await prisma.campaign.update({
            where: { id: campaign.id },
            data: { status: "IN_PROGRESS" },
        });

        // Find active WhatsApp account for this business
        const account = await prisma.whatsappAccount.findFirst({
            where: { businessId: campaign.businessId, status: "ACTIVE" },
        });

        if (!account) {
            console.error(`❌ No active WhatsApp account found for business ${campaign.businessId}`);
            await prisma.campaign.update({
                where: { id: campaign.id },
                data: { status: "FAILED" },
            });
            return;
        }

        // Fetch CRM leads under this business matching selected status enums
        const leads = await prisma.crmLead.findMany({
            where: {
                businessId: campaign.businessId,
                status: {
                    in: campaign.selectedPeople,
                },
                phone: {
                    not: null,
                },
            },
        });

        console.log(`📣 Sending campaign "${campaign.title}" to ${leads.length} leads.`);

        let successCount = 0;
        let failCount = 0;
        const seenPhones = new Set();

        for (const lead of leads) {
            try {
                const formattedPhone = lead.phone.replace(/\D/g, "");
                if (!formattedPhone || formattedPhone.length < 7) {
                    console.warn(`⚠️ Skipping invalid phone number "${lead.phone}" (Lead ID: ${lead.id})`);
                    continue;
                }

                // Deduplicate to prevent sending the message multiple times to the same number in a single campaign run
                if (seenPhones.has(formattedPhone)) {
                    console.log(`⚠️ Skipping duplicate phone number "${formattedPhone}" (Lead ID: ${lead.id})`);
                    continue;
                }
                seenPhones.add(formattedPhone);

                // Resolve or create contact in Robarto system
                const dbContact = await prisma.whatsappContact.upsert({
                    where: {
                        businessId_waUserId: { businessId: campaign.businessId, waUserId: formattedPhone },
                    },
                    update: {
                        name: lead.name || undefined,
                        lastMessageAt: new Date(),
                    },
                    create: {
                        businessId: campaign.businessId,
                        whatsappAccountId: account.id,
                        waUserId: formattedPhone,
                        phoneNumber: formattedPhone,
                        name: lead.name || null,
                        lastMessageAt: new Date(),
                    },
                });

                // Resolve or create conversation
                const conversation = await prisma.whatsappConversation.upsert({
                    where: {
                        businessId_contactId: { businessId: campaign.businessId, contactId: dbContact.id },
                    },
                    update: {
                        lastMessageAt: new Date(),
                    },
                    create: {
                        businessId: campaign.businessId,
                        whatsappAccountId: account.id,
                        contactId: dbContact.id,
                        unreadCount: 0,
                        lastMessageAt: new Date(),
                    },
                });

                // Construct the combined message containing title, scheduled time, optional end date, and campaign message
                const formattedDate = new Date(campaign.scheduledTime).toLocaleString("en-US", {
                    timeZone: "UTC",
                    dateStyle: "medium",
                    timeStyle: "short",
                });
                let dateLine = `*Scheduled Date:* ${formattedDate} UTC`;
                if (campaign.endDate) {
                    const formattedEndDate = new Date(campaign.endDate).toLocaleString("en-US", {
                        timeZone: "UTC",
                        dateStyle: "medium",
                        timeStyle: "short",
                    });
                    dateLine += `\n*End Date:* ${formattedEndDate} UTC`;
                }
                const fullMessage = `*Campaign:* ${campaign.title}\n${dateLine}\n\n${campaign.message}`;

                // Send WhatsApp message via Graph API
                const response = await MetaGraphAPI.sendMessage(
                    account.phoneNumberId,
                    account.accessToken,
                    formattedPhone,
                    fullMessage
                );

                // Log WhatsApp outgoing message in database
                const msg = await prisma.whatsappMessage.create({
                    data: {
                        businessId: campaign.businessId,
                        whatsappAccountId: account.id,
                        conversationId: conversation.id,
                        contactId: dbContact.id,
                        metaMessageId: response.messages?.[0]?.id,
                        direction: "OUTGOING",
                        type: "text",
                        text: fullMessage,
                        status: "SENT",
                    },
                });

                // Update conversation last message ID
                await prisma.whatsappConversation.update({
                    where: { id: conversation.id },
                    data: { lastMessageId: msg.id },
                });

                successCount++;
            } catch (err) {
                console.error(`❌ Failed to send campaign message to lead ${lead.id}:`, err?.message || err);
                failCount++;
            }
        }

        // Update campaign status
        await prisma.campaign.update({
            where: { id: campaign.id },
            data: {
                status: failCount > 0 && successCount === 0 ? "FAILED" : "SENT",
            },
        });

        console.log(`✅ Campaign "${campaign.title}" process completed. Sent: ${successCount}, Failed: ${failCount}`);

    } catch (err) {
        console.error(`❌ Failed to process campaign ${campaignId}:`, err?.message || err);
        await prisma.campaign.update({
            where: { id: campaignId },
            data: { status: "FAILED" },
        });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Sync pending campaigns in the DB to the BullMQ queue (on server startup)
// ─────────────────────────────────────────────────────────────────────────────
export const syncCampaignQueue = async () => {
    try {
        const pendingCampaigns = await prisma.campaign.findMany({
            where: { status: "PENDING" },
        });

        for (const campaign of pendingCampaigns) {
            const jobId = `campaign-${campaign.id}`;
            const existingJob = await campaignQueue.getJob(jobId);
            if (!existingJob) {
                const delay = Math.max(0, campaign.scheduledTime.getTime() - Date.now());
                await campaignQueue.add(
                    "send-campaign",
                    { campaignId: campaign.id },
                    { jobId, delay }
                );
                console.log(`🔄 Re-scheduled pending campaign ${campaign.id} to queue with ${delay}ms delay`);
            }
        }
    } catch (error) {
        console.error("❌ Failed to sync campaign queue on startup:", error);
    }
};

export const CampaignService = {
    createCampaignService,
    getAllCampaignsService,
    getCampaignByIdService,
    updateCampaignService,
    deleteCampaignService,
    processSingleCampaign,
    syncCampaignQueue,
};
