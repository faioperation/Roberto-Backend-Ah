import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/sendResponse.js";
import { NotificationService } from "./notification.service.js";

const getNotifications = async (req, res, next) => {
  try {
    const result = await NotificationService.getNotificationsService(req.user.id, req.query);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Notifications retrieved successfully",
      meta: result.meta,
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const result = await NotificationService.markAsReadService(req.user.id, req.params.id);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Notification marked as read successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    const result = await NotificationService.markAllAsReadService(req.user.id);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "All notifications marked as read successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const saveFCMToken = async (req, res, next) => {
  try {
    const { token, deviceType } = req.body;
    if (!token) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "FCM token is required",
      });
    }

    const result = await NotificationService.saveFCMTokenService(req.user.id, token, deviceType);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "FCM registration token saved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const NotificationController = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  saveFCMToken,
};
