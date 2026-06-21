import prisma from "../../prisma/client.js";
import { messaging } from "../../config/firebase.js";
import { QueryBuilder } from "../../utils/QueryBuilder.js";

/**
 * Creates and dispatches a notification to all matching recipients.
 */
const createAndSendNotification = async ({
  title,
  message,
  type,
  role = null,
  businessId = null,
  branchId = null,
  userId = null, // specific recipient (optional)
  conversationId = null,
}) => {
  try {
    const recipients = new Set();

    // 1. If a specific userId is targetted, add them
    if (userId) {
      recipients.add(userId);
    }

    // 2. All SYSTEM_OWNER users always receive all notifications
    const systemOwners = await prisma.user.findMany({
      where: {
        roles: {
          some: {
            role: { name: "SYSTEM_OWNER" }
          }
        }
      },
      select: { id: true }
    });
    systemOwners.forEach(u => recipients.add(u.id));

    // 3. If businessId is specified, the Business Owner gets it
    if (businessId) {
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: { ownerId: true }
      });
      if (business?.ownerId) {
        recipients.add(business.ownerId);
      }
    }

    // 4. If branchId is specified, the Branch Manager gets it
    if (branchId) {
      const branch = await prisma.branch.findUnique({
        where: { id: branchId },
        include: { manager: true }
      });
      if (branch?.manager?.email) {
        const managerUser = await prisma.user.findFirst({
          where: { email: branch.manager.email },
          select: { id: true }
        });
        if (managerUser?.id) {
          recipients.add(managerUser.id);
        }
      }
    }

    if (recipients.size === 0) {
      console.log("⚠️ No recipients found for notification:", title);
      return [];
    }

    // Save notification to the database for each recipient
    const notificationPromises = Array.from(recipients).map(uid =>
      prisma.notification.create({
        data: {
          title,
          message,
          type,
          role,
          businessId,
          branchId,
          userId: uid,
          conversationId,
          isRead: false
        }
      })
    );

    const savedNotifications = await Promise.all(notificationPromises);

    // Send push notification via FCM if Firebase is initialized
    try {
      const tokens = await prisma.fCMToken.findMany({
        where: { userId: { in: Array.from(recipients) } },
        select: { token: true }
      });

      if (tokens.length > 0) {
        const registrationTokens = tokens.map(t => t.token);
        const messagePayload = {
          notification: {
            title,
            body: message,
          },
          data: {
            type: String(type || ""),
            businessId: String(businessId || ""),
            branchId: String(branchId || ""),
          },
          tokens: registrationTokens,
        };

        if (!messaging) {
          console.warn("⚠️ [FCM] Push notifications skipped (FCM admin not initialized).");
          return savedNotifications;
        }

        const response = await messaging.sendEachForMulticast(messagePayload);
        console.log(`📦 [FCM] Sent ${response.successCount} push notifications. Failures: ${response.failureCount}`);

        // Clean up invalid or stale tokens
        if (response.failureCount > 0) {
          const tokensToRemove = [];
          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              const error = resp.error;
              if (
                error?.code === "messaging/invalid-registration-token" ||
                error?.code === "messaging/registration-token-not-registered"
              ) {
                tokensToRemove.push(registrationTokens[idx]);
              }
            }
          });

          if (tokensToRemove.length > 0) {
            await prisma.fCMToken.deleteMany({
              where: { token: { in: tokensToRemove } }
            });
            console.log(`🧹 [FCM] Cleaned up ${tokensToRemove.length} invalid FCM tokens.`);
          }
        }
      }
    } catch (fcmError) {
      console.error("❌ [FCM] Error sending multicast push notification:", fcmError.message);
    }

    return savedNotifications;
  } catch (error) {
    console.error("❌ [NotificationService] Error creating notification:", error);
    return [];
  }
};

/**
 * Gets paginated notifications list for a specific user.
 */
const getNotificationsService = async (userId, query = {}) => {
  const queryBuilder = new QueryBuilder(query)
    .filter()
    .sort()
    .paginate()
    .fields();

  const queryParams = queryBuilder.build();
  
  // Enforce filter by user ID
  queryParams.where = {
    ...queryParams.where,
    userId,
  };

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany(queryParams),
    prisma.notification.count({ where: queryParams.where }),
  ]);

  const unreadCount = await prisma.notification.count({
    where: { userId, isRead: false }
  });

  return {
    meta: {
      ...queryBuilder.getMeta(total),
      total,
      unreadCount,
    },
    data: notifications,
  };
};

/**
 * Marks a notification as read.
 */
const markAsReadService = async (userId, id) => {
  const notification = await prisma.notification.findFirst({
    where: { id, userId }
  });

  if (!notification) {
    throw new Error("Notification not found or access denied");
  }

  return await prisma.notification.update({
    where: { id },
    data: { isRead: true }
  });
};

/**
 * Marks all notifications of a user as read.
 */
const markAllAsReadService = async (userId) => {
  return await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true }
  });
};

/**
 * Registers or updates an FCM token for a user.
 */
const saveFCMTokenService = async (userId, token, deviceType = "WEB") => {
  return await prisma.fCMToken.upsert({
    where: { token },
    update: {
      userId,
      deviceType,
    },
    create: {
      userId,
      token,
      deviceType,
    }
  });
};

/**
 * Checks if a message notification should be sent based on throttling rules:
 * 1. If AI is paused/off (aiReply === false), always send notification for every message.
 * 2. If AI is active/resumed (aiReply === true):
 *    - Notify on the first message (when no prior message notifications exist).
 *    - Otherwise, do not notify unless:
 *      - It has been >= 24 hours since the last message notification,
 *      - OR there has been a gap of >= 12 hours since the previous message in the conversation.
 */
const shouldSendMessageNotification = async (conversationId, platform) => {
  try {
    let aiReply = true;

    if (platform === "whatsapp") {
      const conv = await prisma.whatsappConversation.findUnique({
        where: { id: conversationId },
        select: { aiReply: true }
      });
      if (conv) aiReply = conv.aiReply;
    } else {
      const conv = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { aiReply: true }
      });
      if (conv) aiReply = conv.aiReply;
    }

    // Rule 1: If AI reply is off/paused (aiReply === false), always send notification
    if (!aiReply) {
      console.log(`[Notification Throttling] AI is paused/off for conversation ${conversationId}. Allowing notification.`);
      return true;
    }

    // Rule 2: If AI reply is active (aiReply === true), check throttling
    const lastNotification = await prisma.notification.findFirst({
      where: { conversationId, type: "NEW_MESSAGE" },
      orderBy: { createdAt: "desc" }
    });

    if (!lastNotification) {
      console.log(`[Notification Throttling] First message notification for conversation ${conversationId}. Allowing.`);
      return true;
    }

    const now = new Date();
    const lastNotifiedAt = new Date(lastNotification.createdAt);
    const hoursSinceLastNotification = (now - lastNotifiedAt) / (1000 * 60 * 60);

    // If it has been more than 24 hours since the last notification, notify!
    if (hoursSinceLastNotification >= 24) {
      console.log(`[Notification Throttling] >= 24 hours since last notification for conversation ${conversationId}. Allowing.`);
      return true;
    }

    // Check if there was a gap of >= 12 hours with no messages at all in the conversation
    let gapHours = 0;
    if (platform === "whatsapp") {
      const recentMessages = await prisma.whatsappMessage.findMany({
        where: { conversationId },
        orderBy: { createdAt: "desc" },
        take: 2
      });

      if (recentMessages.length >= 2) {
        const prevMsgTime = new Date(recentMessages[1].createdAt);
        gapHours = (now - prevMsgTime) / (1000 * 60 * 60);
      } else {
        // Less than 2 messages means it's the beginning of conversation
        gapHours = 999;
      }
    } else {
      const recentMessages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: "desc" },
        take: 2
      });

      if (recentMessages.length >= 2) {
        const prevMsgTime = new Date(recentMessages[1].createdAt);
        gapHours = (now - prevMsgTime) / (1000 * 60 * 60);
      } else {
        gapHours = 999;
      }
    }

    if (gapHours >= 12) {
      console.log(`[Notification Throttling] Gap of ${gapHours.toFixed(1)} hours (>= 12 hours) with no messages in conversation ${conversationId}. Allowing.`);
      return true;
    }

    console.log(`[Notification Throttling] Notification throttled for conversation ${conversationId} (Hours since last notification: ${hoursSinceLastNotification.toFixed(1)}, Gap: ${gapHours.toFixed(1)} hours).`);
    return false;
  } catch (error) {
    console.error("❌ Error in shouldSendMessageNotification:", error);
    return true; // Fallback to send in case of error
  }
};

export const NotificationService = {
  createAndSendNotification,
  getNotificationsService,
  markAsReadService,
  markAllAsReadService,
  saveFCMTokenService,
  shouldSendMessageNotification,
};
