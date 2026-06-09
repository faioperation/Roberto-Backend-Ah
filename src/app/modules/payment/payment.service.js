import Stripe from "stripe";
import prisma from "../../prisma/client.js";
import DevBuildError from "../../lib/DevBuildError.js";
import { StatusCodes } from "http-status-codes";
import { envVars } from "../../config/env.js";

const stripe = new Stripe(envVars.STRIPE_SECRET_KEY);

const createStripeCheckoutSession = async (user, planId, billingCycle) => {
  // Find business for the user
  const business = await prisma.business.findFirst({
    where: { ownerId: user.id },
  });

  if (!business) {
    throw new DevBuildError(
      "Business not found for this user",
      StatusCodes.NOT_FOUND,
    );
  }

  // Find the plan
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
  });

  if (!plan) {
    throw new DevBuildError("Subscription plan not found", StatusCodes.NOT_FOUND);
  }

  // Determine Stripe Price ID
  const priceId =
    billingCycle === "yearly"
      ? plan.stripeYearlyPriceId
      : plan.stripeMonthlyPriceId;

  if (!priceId) {
    throw new DevBuildError(
      `Stripe price ID for ${billingCycle} is not configured for this plan`,
      StatusCodes.INTERNAL_SERVER_ERROR,
    );
  }

  // Frontend Success/Cancel URLs
  const frontendUrl = envVars.FRONT_END_URL || "http://localhost:3000";
  const successUrl = `${frontendUrl}/business-owner/subscriptions?session_id={CHECKOUT_SESSION_ID}&success=true`;
  const cancelUrl = `${frontendUrl}/business-owner/subscriptions?canceled=true`;

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "subscription",
    client_reference_id: business.id,
    customer_email: user.email,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    metadata: {
      businessId: business.id,
      planId: plan.id,
      billingCycle: billingCycle,
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return { url: session.url };
};

const processStripeWebhook = async (event) => {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const businessId =
      session.metadata?.businessId || session.client_reference_id;
    const planId = session.metadata?.planId;

    // We get billing cycle from metadata, or we can fetch subscription details from stripe
    const billingCycle = session.metadata?.billingCycle || "monthly";

    if (businessId && planId) {
      // Fetch the business and owner details
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        include: { owner: true },
      });

      // Deactivate any existing active subscription
      await prisma.businessSubscription.updateMany({
        where: { businessId, status: "ACTIVE" },
        data: { status: "CANCELED" },
      });

      // Calculate end date based on billing cycle
      const startDate = new Date();
      const endDate = new Date(startDate);
      if (billingCycle === "yearly") {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      // Create new active subscription
      const newSubscription = await prisma.businessSubscription.create({
        data: {
          businessId: businessId,
          planId: planId,
          status: "ACTIVE",
          billingCycle: billingCycle === "yearly" ? "YEARLY" : "MONTHLY",
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription,
          startDate: startDate,
          endDate: endDate,
        },
      });

      // Get plan price to record invoice
      const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
      const amount =
        billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;

      // Create an invoice record
      await prisma.subscriptionInvoice.create({
        data: {
          businessId: businessId,
          subscriptionId: newSubscription.id,
          invoiceNo: session.invoice || `INV-${Date.now()}`,
          amount: amount || 0,
          status: "paid", // Mark as paid
          billingCycle: billingCycle === "yearly" ? "YEARLY" : "MONTHLY",
          stripeInvoiceId: session.invoice || null,
        },
      });

      // Log plan purchase in activity log
      if (business && plan) {
        await prisma.activityLog.create({
          data: {
            activityName: "PLAN_PURCHASED",
            activityTitle: `${business.name} purchased ${plan.name} plan`,
            activityType: "PAYMENT",
            createdById: business.ownerId,
          }
        });
      }
    }
  }

  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object;
  }
};

const getMySubscription = async (user) => {
  const business = await prisma.business.findFirst({
    where: { ownerId: user.id },
  });

  if (!business) {
    throw new DevBuildError(
      "Business not found for this user",
      StatusCodes.NOT_FOUND,
    );
  }

  const subscriptions = await prisma.businessSubscription.findMany({
    where: { businessId: business.id },
    include: {
      plan: {
        include: {
          features: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return subscriptions;
};

export const PaymentService = {
  createStripeCheckoutSession,
  processStripeWebhook,
  getMySubscription,
};
