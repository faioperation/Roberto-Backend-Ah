import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../../utils/sendResponse.js";
import { TwiloNumberCallService } from "./twiloNumberCall.service.js";

const setupTwilio = async (req, res, next) => {
  try {
    const payload = req.body;
    const result = await TwiloNumberCallService.setupTwilioService(payload);

    sendResponse(res, {
      success: true,
      message: result.message,
      statusCode: StatusCodes.OK,
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
};

export const TwiloNumberCallController = {
  setupTwilio,
};
