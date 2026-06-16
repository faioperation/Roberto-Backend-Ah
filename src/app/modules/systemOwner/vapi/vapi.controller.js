import { StatusCodes } from "http-status-codes";
import prisma from "../../../prisma/client.js";
import { extractBookingPayload, extractLeadPayload } from "../../../utils/workflowHelpers.js";

export const handleVapiWebhook = async (req, res, next) => {
  try {
    const payload = req.body;
    const eventType = payload.message?.type || payload.type;
    console.log(`ℹ️ [Vapi Webhook] Event Type: ${eventType}`);

    // Extract analysis data
    const analysis = payload.message?.analysis || payload.analysis || payload.message?.call?.analysis || null;
    
    // Extract agentId / assistantId
    const agentId = payload.message?.call?.assistantId || 
                    payload.message?.assistantId || 
                    payload.assistantId || 
                    payload.message?.call?.assistant?.id || 
                    payload.message?.assistant?.id ||
                    payload.message?.call?.agentId ||
                    payload.message?.agentId ||
                    payload.agentId ||
                    null;

    console.log("🤖 [Vapi Webhook] Agent/Assistant ID:", agentId);
    console.log("📊 [Vapi Webhook] Analysis Data:", JSON.stringify(analysis, null, 2));

    // Only process and insert data if we have an agentId and it's an end-of-call event or contains analysis
    const hasAnalysis = analysis && Object.keys(analysis).length > 0;
    const isEndOfCallReport = eventType === "end-of-call-report" || eventType === "end-of-call";

    if (agentId && (isEndOfCallReport || hasAnalysis)) {
      try {
        // 1. Find agent matching vapiId
        const agent = await prisma.agent.findFirst({
          where: { vapiId: agentId }
        });

        if (agent) {
          console.log(`✅ [Vapi Webhook] Found matching Agent in DB. BusinessId: ${agent.businessId}, BranchId: ${agent.branchId}`);
          
          const structuredData = analysis?.structuredData || payload.message?.call?.analysis?.structuredData || {};

          // Extract customer/order fields with fallback
          const customerName = structuredData.customerName || 
                               structuredData.customer_name || 
                               structuredData.name || 
                               payload.message?.customer?.name || 
                               payload.customer?.name || 
                               "Vapi Customer";

          const customerNumber = structuredData.customerNumber || 
                                 structuredData.customer_number || 
                                 structuredData.customerPhone || 
                                 structuredData.customer_phone || 
                                 structuredData.phone || 
                                 structuredData.phoneNumber || 
                                 structuredData.phone_number || 
                                 payload.message?.customer?.number || 
                                 payload.customer?.number || 
                                 payload.message?.call?.customer?.number || 
                                 "";

          const email = structuredData.email || 
                        structuredData.customerEmail || 
                        structuredData.customer_email || 
                        "";

          const price = structuredData.price || 
                        structuredData.cost || 
                        structuredData.total || 
                        "0";

          const orderNote = structuredData.orderNote || 
                            structuredData.order_note || 
                            structuredData.note || 
                            structuredData.notes || 
                            analysis?.summary || 
                            "";

          console.log("👤 [Vapi Webhook] Extracted Customer Info:", {
            customerName,
            customerNumber,
            email,
            price,
            orderNote
          });

          // 2. Create OrderBooking (analysis as metadata)
          const cleanBooking = await extractBookingPayload(agent.businessId, {
            branchId: agent.branchId,
            customerName,
            customerNumber,
            email,
            price,
            orderNote,
            metadata: analysis || {} // Storing only the analysis object
          });

          const newBooking = await prisma.orderBooking.create({
            data: cleanBooking
          });
          console.log(`📦 [Vapi Webhook] Successfully created OrderBooking: ${newBooking.id}`);

          // 3. Create CrmLead (structuredData as metadata)
          const cleanLead = await extractLeadPayload(agent.businessId, {
            branchId: agent.branchId,
            name: customerName,
            email,
            phone: customerNumber,
            note: orderNote,
            metadata: structuredData
          });

          const newLead = await prisma.crmLead.create({
            data: cleanLead
          });
          console.log(`👥 [Vapi Webhook] Successfully created CrmLead: ${newLead.id}`);
        } else {
          console.warn(`⚠️ [Vapi Webhook] No Agent found in database for Vapi assistant ID: ${agentId}`);
        }
      } catch (dbError) {
        console.error("❌ [Vapi Webhook] Error saving booking/lead data to database:", dbError);
      }
    }

    // Send a 200 OK response to Vapi
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Webhook processed successfully",
    });
  } catch (error) {
    next(error);
  }
};

