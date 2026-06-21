import { Router } from "express";
import { AuthRouter } from "../modules/auth/auth.route.js";
import { OtpRouter } from "../modules/otp/otp.route.js";
import { UserRoutes } from "../modules/user/user.route.js";
import { BusinessRoutes } from "../modules/systemOwner/businessManagement/businessManagement.route.js";
import { GlobalBusinessRoutes } from "../modules/publicApi/globalBusiness/globalBusiness.route.js";
import { SubscriptionPlanRoutes } from "../modules/systemOwner/subscriptionPlan/subscriptionPlan.route.js";
import { ActivityLogRoutes } from "../modules/systemOwner/activityLog/activityLog.route.js";
import { AgentTrainingRoutes } from "../modules/systemOwner/agentTraining/agentTraining.route.js";
import { AgentManagementRoutes } from "../modules/systemOwner/agentManagement/agentManagement.route.js";
import { BranchManagerRoutes } from "../modules/businessOwner/branchManager/branchManager.route.js";
import { BranchRoutes } from "../modules/businessOwner/branch/branch.route.js";
import { OrderBookingRoutes } from "../modules/businessOwner/orderBooking/orderBooking.route.js";
import { PricingRoutes } from "../modules/businessOwner/pricing/pricing.route.js";
import { CrmLeadRoutes } from "../modules/businessOwner/crmLead/crmLead.route.js";
import { CampaignRoutes } from "../modules/businessOwner/campaign/campaign.route.js";
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
import { PublicPricingRoutes } from "../modules/publicApi/pricing/pricing.route.js";
import { PublicChatSummaryRoutes } from "../modules/publicApi/chatSummary/chatSummary.route.js";
import { ChatSummaryRoutes } from "../modules/chatSummary/chatSummary.route.js";
import { VapiRoutes } from "../modules/systemOwner/vapi/vapi.route.js";
import { PublicSubscriptionRoutes } from "../modules/publicApi/subscriptionPlan/subscriptionPlan.route.js";
import { PublicCampaignRoutes } from "../modules/publicApi/campaignPublic/campaignPublic.route.js";
import { DashboardOverviewBRoutes } from "../modules/businessOwner/dashboardOvervieB/dashboardOvervieB.route.js";
import { DashboardOverviewMRoutes } from "../modules/branchManager/dashboardOverviewM/dashboardOverviewM.route.js";
import { TelephonyRoutes } from "../modules/systemOwner/twiloNumberCall/twiloNumberCall.route.js";
import { DashboardOverviewSRoutes } from "../modules/systemOwner/dashboardOverviewS/dashboardOverviewS.route.js";
import { ConversationOffRoutes } from "../modules/conversationOff/conversationOff.route.js";
import { NotificationRoutes } from "../modules/notification/notification.route.js";

export const router = Router();

const moduleRoutes = [
  { path: "/notifications", route: NotificationRoutes },
  { path: "/user", route: UserRoutes },
  { path: "/auth", route: AuthRouter },
  { path: "/otp", route: OtpRouter },
  { path: "/system-owner/businesses", route: BusinessRoutes },
  { path: "/global/business", route: GlobalBusinessRoutes },
  { path: "/system-owner/subscription-plans", route: SubscriptionPlanRoutes },
  { path: "/system-owner/activity-logs", route: ActivityLogRoutes },
  { path: "/system-owner/agent-trainings", route: AgentTrainingRoutes },
  { path: "/system-owner/agent-management", route: AgentManagementRoutes },
  { path: "/business-owner/branch-managers", route: BranchManagerRoutes },
  { path: "/business-owner/branches", route: BranchRoutes },
  // Dynamic booking — routes to correct table based on businessType
  { path: "/business-owner/bookings", route: OrderBookingRoutes },
  { path: "/business-owner/pricings", route: PricingRoutes },
  { path: "/business-owner/crm-leads", route: CrmLeadRoutes },
  { path: "/business-owner/campaigns", route: CampaignRoutes },
  { path: "/branch-manager/pricing", route: PricingBranchRoutes },
  { path: "/branch-manager/crm-leads", route: CrmLeadsManagerRoutes },
  { path: "/branch-manager/bookings", route: OrderBookingBranchRoutes },
  { path: "/v1", route: MessengerRoutes },
  { path: "/v1", route: WhatsappRoutes },
  { path: "/v1", route: InstagramRoutes },
  { path: "/v1/public/facebook", route: PublicFacebookRoutes },
  { path: "/v1/public/instagram", route: PublicInstagramRoutes },
  { path: "/v1/public/whatsapp", route: PublicWhatsappRoutes },
  { path: "/payment", route: PaymentRouter },
  { path: "/leads", route: PublicLeadRoutes },
  { path: "/bookings", route: PublicBookingRoutes },
  { path: "/v1/public/agent-training", route: PublicAgentTrainingRoutes },
  { path: "/v1/public/pricings", route: PublicPricingRoutes },
  { path: "/v1/public/chat-summaries", route: PublicChatSummaryRoutes },
  { path: "/chat-summaries", route: ChatSummaryRoutes },
  { path: "/webhook", route: VapiRoutes },
  { path: "/public/subscription-plans", route: PublicSubscriptionRoutes },
  { path: "/v1/public/campaigns", route: PublicCampaignRoutes },
  { path: "/business-owner/dashboard", route: DashboardOverviewBRoutes },
  { path: "/branch-manager/dashboard", route: DashboardOverviewMRoutes },
  { path: "/system-owner/telephony", route: TelephonyRoutes },
  { path: "/system-owner/dashboard", route: DashboardOverviewSRoutes },
  { path: "/conversation-off", route: ConversationOffRoutes },
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});