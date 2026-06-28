import prisma from "../prisma/client.js";
import DevBuildError from "../lib/DevBuildError.js";
import { StatusCodes } from "http-status-codes";

/**
 * Checks if a business is allowed to create another branch based on its subscription plan limits.
 * @param {string} businessId 
 */
export const checkBranchLimit = async (businessId) => {
  const activeSubscription = await prisma.businessSubscription.findFirst({
    where: {
      businessId,
      status: "ACTIVE",
    },
    include: {
      plan: true,
    },
  });

  // If there is no active subscription, we let general system checks handle it (e.g. checkAuthMiddleware)
  if (!activeSubscription) {
    return;
  }

  const planSlug = activeSubscription.plan.slug.toLowerCase();

  if (planSlug === "connect" || planSlug === "convert") {
    const branchCount = await prisma.branch.count({
      where: { businessId },
    });

    if (branchCount >= 1) {
      throw new DevBuildError(
        "Your current subscription plan limits you to creating only 1 branch.",
        StatusCodes.BAD_REQUEST
      );
    }
  }
};

/**
 * Checks if a business has reached its conversation limits (Facebook + Instagram + WhatsApp).
 * @param {string} businessId 
 * @returns {Promise<boolean>} isLimitReached
 */
export const isConversationLimitReached = async (businessId) => {
  const activeSubscription = await prisma.businessSubscription.findFirst({
    where: {
      businessId,
      status: "ACTIVE",
    },
    include: {
      plan: true,
    },
  });

  if (!activeSubscription) {
    return false;
  }

  const planSlug = activeSubscription.plan.slug.toLowerCase();

  if (planSlug === "connect" || planSlug === "convert") {
    const [standardCount, whatsappCount] = await Promise.all([
      prisma.conversation.count({
        where: { businessId },
      }),
      prisma.whatsappConversation.count({
        where: { businessId },
      }),
    ]);

    const totalConversations = standardCount + whatsappCount;

    if (planSlug === "connect" && totalConversations >= 1000) {
      return true;
    }

    if (planSlug === "convert" && totalConversations >= 5000) {
      return true;
    }
  }

  return false;
};
