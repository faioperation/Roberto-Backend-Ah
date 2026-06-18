import Stripe from "stripe";
import prisma from "../../prisma/client.js";
import DevBuildError from "../../lib/DevBuildError.js";
import { StatusCodes } from "http-status-codes";
import { envVars } from "../../config/env.js";
import { sendEmail } from "../../utils/sendEmail.js";
import { generateInvoicePdf } from "../../utils/generateInvoicePdf.js";

const stripe = new Stripe(envVars.STRIPE_SECRET_KEY);

// ─────────────────────────────────────────────────────────────────────────────
// Create Stripe Checkout Session
// ─────────────────────────────────────────────────────────────────────────────
const createStripeCheckoutSession = async (user, planId, billingCycle) => {
  const business = await prisma.business.findFirst({
    where: { ownerId: user.id },
  });

  if (!business) {
    throw new DevBuildError("Business not found for this user", StatusCodes.NOT_FOUND);
  }

  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });

  if (!plan) {
    throw new DevBuildError("Subscription plan not found", StatusCodes.NOT_FOUND);
  }

  const priceId =
    billingCycle === "yearly" ? plan.stripeYearlyPriceId : plan.stripeMonthlyPriceId;

  if (!priceId) {
    throw new DevBuildError(
      `Stripe price ID for ${billingCycle} is not configured for this plan`,
      StatusCodes.INTERNAL_SERVER_ERROR,
    );
  }

  const frontendUrl = envVars.FRONT_END_URL || "http://localhost:3000";
  const successUrl = `${frontendUrl}/business-owner/subscriptions?session_id={CHECKOUT_SESSION_ID}&success=true`;
  const cancelUrl  = `${frontendUrl}/business-owner/subscriptions?canceled=true`;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "subscription",
    client_reference_id: business.id,
    customer_email: user.email,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { businessId: business.id, planId: plan.id, billingCycle },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return { url: session.url };
};

// ─────────────────────────────────────────────────────────────────────────────
// Process Stripe Webhook
// ─────────────────────────────────────────────────────────────────────────────
const processStripeWebhook = async (event) => {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const businessId = session.metadata?.businessId || session.client_reference_id;
    const planId     = session.metadata?.planId;
    const billingCycle = session.metadata?.billingCycle || "monthly";

    if (!businessId || !planId) return;

    // Fetch business + owner
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: { owner: true },
    });

    // Cancel any existing active subscription
    await prisma.businessSubscription.updateMany({
      where: { businessId, status: "ACTIVE" },
      data:  { status: "CANCELED" },
    });

    // Compute subscription period
    const startDate = new Date();
    const endDate   = new Date(startDate);
    if (billingCycle === "yearly") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Create subscription record
    const newSubscription = await prisma.businessSubscription.create({
      data: {
        businessId,
        planId,
        status:              "ACTIVE",
        billingCycle:        billingCycle === "yearly" ? "YEARLY" : "MONTHLY",
        stripeCustomerId:    session.customer,
        stripeSubscriptionId: session.subscription,
        startDate,
        endDate,
      },
    });

    // Activate business
    await prisma.business.update({
      where: { id: businessId },
      data:  { status: "ACTIVE" },
    });

    // Fetch plan details for amount
    const plan   = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    const amount = billingCycle === "yearly" ? plan?.yearlyPrice : plan?.monthlyPrice;

    const invoiceNo = session.invoice || `INV-${Date.now()}`;

    // Create invoice record (without PDF yet)
    const invoiceRecord = await prisma.subscriptionInvoice.create({
      data: {
        businessId,
        subscriptionId:  newSubscription.id,
        invoiceNo,
        amount:          amount || 0,
        status:          "paid",
        billingCycle:    billingCycle === "yearly" ? "YEARLY" : "MONTHLY",
        stripeInvoiceId: session.invoice || null,
      },
    });

    // Generate PDF invoice
    let invoiceUrl = null;
    try {
      const pdfResult = await generateInvoicePdf({
        invoiceNo,
        businessName:  business?.name  || "N/A",
        businessEmail: business?.email || business?.owner?.email || "N/A",
        planName:      plan?.name      || "Subscription",
        billingCycle:  billingCycle.toUpperCase(),
        amount:        amount || 0,
        currency:      plan?.currency  || "USD",
        issuedAt:      new Date(),
        periodStart:   startDate,
        periodEnd:     endDate,
      });

      await prisma.subscriptionInvoice.update({
        where: { id: invoiceRecord.id },
        data:  { invoicePath: pdfResult.invoicePath, invoiceUrl: pdfResult.invoiceUrl },
      });

      invoiceUrl = pdfResult.invoiceUrl;
    } catch (pdfErr) {
      console.error("❌ Failed to generate invoice PDF:", pdfErr);
    }

    // Activity log
    if (business && plan) {
      await prisma.activityLog.create({
        data: {
          activityName:  "PLAN_PURCHASED",
          activityTitle: `${business.name} purchased ${plan.name} plan`,
          activityType:  "PAYMENT",
          createdById:   business.ownerId,
        },
      });

      // Send subscription success email
      if (business.owner?.email) {
        try {
          await sendEmail({
            to:           business.owner.email,
            subject:      "Subscription Activated - Welcome to Robarto!",
            templateName: "subscriptionSuccess",
            templateData: {
              name:         `${business.owner.firstName || ""} ${business.owner.lastName || ""}`.trim() || "Business Owner",
              businessName: business.name,
              planName:     plan.name,
              billingCycle: billingCycle.toUpperCase(),
              amount:       amount || 0,
              currency:     plan.currency || "USD",
              invoiceUrl:   invoiceUrl || null,
              frontendUrl:  envVars.FRONT_END_URL || "http://localhost:3000",
            },
          });
        } catch (emailErr) {
          console.error("❌ Failed to send subscription success email:", emailErr);
        }
      }
    }
  }

  if (event.type === "invoice.payment_succeeded") {
    // Reserved for future recurring invoice handling
    const _invoice = event.data.object;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Get My Subscription
// ─────────────────────────────────────────────────────────────────────────────
const getMySubscription = async (user) => {
  const business = await prisma.business.findFirst({ where: { ownerId: user.id } });

  if (!business) {
    throw new DevBuildError("Business not found for this user", StatusCodes.NOT_FOUND);
  }

  const subscriptions = await prisma.businessSubscription.findMany({
    where:   { businessId: business.id },
    include: {
      plan: { include: { features: true } },
      invoices: {
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return subscriptions.map((sub) => {
    const cleanedInvoices = sub.invoices?.map((inv) => {
      let pathVal = inv.invoicePath;
      if (pathVal && pathVal.includes("uploads")) {
        const normalized = pathVal.replace(/\\/g, "/");
        const idx = normalized.indexOf("uploads/");
        if (idx !== -1) {
          pathVal = normalized.substring(idx);
        }
      }
      return {
        ...inv,
        invoicePath: pathVal,
      };
    }) || [];

    const latestInvoice = cleanedInvoices[0] || null;
    return {
      ...sub,
      invoices: cleanedInvoices,
      invoicePath: latestInvoice?.invoicePath || null,
      invoiceUrl: latestInvoice?.invoiceUrl || null,
    };
  });
};

export const PaymentService = {
  createStripeCheckoutSession,
  processStripeWebhook,
  getMySubscription,
};
