import { StatusCodes } from "http-status-codes";

export const handleVapiWebhook = async (req, res, next) => {
  try {
    const payload = req.body;

    // Extract and console log analysis data specifically
    const analysis = payload.message?.analysis || payload.analysis || payload.message?.call?.analysis || null;
    console.log("📊 [Vapi Webhook] Analysis Data:", JSON.stringify(analysis, null, 2));

    // Send a 200 OK response to Vapi
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Webhook processed successfully",
    });
  } catch (error) {
    next(error);
  }
};
