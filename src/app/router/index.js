import { Router } from "express";
import { AuthRouter } from "../modules/auth/auth.route.js";
import { OtpRouter } from "../modules/otp/otp.route.js";
import { UserRoutes } from "../modules/user/user.route.js";
import { BusinessRoutes } from "../modules/systemOwner/businessManagement/businessManagement.route.js";
import { SubscriptionPlanRoutes } from "../modules/systemOwner/subscriptionPlan/subscriptionPlan.route.js";
import { ActivityLogRoutes } from "../modules/systemOwner/activityLog/activityLog.route.js";
import { AgentTrainingRoutes } from "../modules/systemOwner/agentTraining/agentTraining.route.js";
import { BranchManagerRoutes } from "../modules/businessOwner/branchManager/branchManager.route.js";
import { BranchRoutes } from "../modules/businessOwner/branch/branch.route.js";
import { OrderBookingRoutes } from "../modules/businessOwner/orderBooking/orderBooking.route.js";
import { PricingRoutes } from "../modules/businessOwner/pricing/pricing.route.js";
import { CrmLeadRoutes } from "../modules/businessOwner/crmLead/crmLead.route.js";
import { PricingBranchRoutes } from "../modules/branchManager/pricingBranch/pricingBranch.route.js";
import { CrmLeadsManagerRoutes } from "../modules/branchManager/crmLeadsManager/crmLeadsManager.route.js";
import { OrderBookingBranchRoutes } from "../modules/branchManager/orderBookingBranch/orderBookingBranch.route.js";
import { MessengerRoutes } from "../modules/messenger/messenger.route.js";
import { WhatsappRoutes } from "../modules/whatsapp/whatsapp.routes.js";
import { InstagramRoutes } from "../modules/instagram/instagram.route.js";
import { PublicFacebookRoutes } from "../modules/publicApi/facebook/facebook.route.js";
import { PublicInstagramRoutes } from "../modules/publicApi/instagram/instagram.route.js";
import { PublicWhatsappRoutes } from "../modules/publicApi/whatsapp/whatsapp.route.js";
import { PaymentRouter } from "../modules/payment/payment.route.js";
import { PublicLeadRoutes } from "../modules/publicApi/leads/leads.route.js";
import { PublicBookingRoutes } from "../modules/publicApi/bookings/bookings.route.js";
import { PublicAgentTrainingRoutes } from "../modules/publicApi/agentTraining/agentTraining.route.js";

export const router = Router();
const moduleRoutes = [
  {
    path: "/user",
    route: UserRoutes,
  },
  {
    path: "/auth",
    route: AuthRouter,
  },
  {
    path: "/otp",
    route: OtpRouter,
  },
  {
    path: "/system-owner/businesses",
    route: BusinessRoutes,
  },
  {
    path: "/system-owner/subscription-plans",
    route: SubscriptionPlanRoutes,
  },
  {
    path: "/system-owner/activity-logs",
    route: ActivityLogRoutes,
  },
  {
    path: "/system-owner/agent-trainings",
    route: AgentTrainingRoutes,
  },
  {
    path: "/business-owner/branch-managers",
    route: BranchManagerRoutes,
  },
  {
    path: "/business-owner/branches",
    route: BranchRoutes,
  },
  {
    path: "/business-owner/order-bookings",
    route: OrderBookingRoutes,
  },
  {
    path: "/business-owner/pricings",
    route: PricingRoutes,
  },
  {
    path: "/business-owner/crm-leads",
    route: CrmLeadRoutes,
  },
  {
    path: "/branch-manager/pricing",
    route: PricingBranchRoutes,
  },
  {
    path: "/branch-manager/crm-leads",
    route: CrmLeadsManagerRoutes,
  },
  {
    path: "/branch-manager/order-bookings",
    route: OrderBookingBranchRoutes,
  },
  {
    path: "/v1",
    route: MessengerRoutes,
  },
  {
    path: "/v1",
    route: WhatsappRoutes,
  },
  {
    path: "/v1",
    route: InstagramRoutes,
  },
  {
    path: "/v1/public/facebook",
    route: PublicFacebookRoutes,
  },
  {
    path: "/v1/public/instagram",
    route: PublicInstagramRoutes,
  },
  {
    path: "/v1/public/whatsapp",
    route: PublicWhatsappRoutes,
  },
  {
    path: "/payment",
    route: PaymentRouter,
  },
  {
    path: "/leads",
    route: PublicLeadRoutes,
  },
  {
    path: "/bookings",
    route: PublicBookingRoutes,
  },
  {
    path: "/v1/public/agent-training",
    route: PublicAgentTrainingRoutes,
  }
];


moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});