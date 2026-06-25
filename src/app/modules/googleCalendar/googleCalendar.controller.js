import { GoogleCalendarService } from "./googleCalendar.service.js";
import { sendResponse } from "../../utils/sendResponse.js";
import { StatusCodes } from "http-status-codes";
import { envVars } from "../../config/env.js";
import DevBuildError from "../../lib/DevBuildError.js";

const getAuthUrl = async (req, res, next) => {
  try {
    const businessId = req.business.id;
    const { branchId } = req.query;

    if (!branchId) {
      throw new DevBuildError("branchId query parameter is required", StatusCodes.BAD_REQUEST);
    }

    // Determine the role of the user requesting connection
    const userRoleNames = req.user.roles?.map(r => r.role.name) || [];
    const role = userRoleNames.includes("BRANCH_MANAGER") ? "BRANCH_MANAGER" : "BUSINESS_OWNER";

    const url = await GoogleCalendarService.getAuthUrlService(businessId, branchId, req.user, role);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Google OAuth URL generated successfully",
      data: { url },
    });
  } catch (error) {
    next(error);
  }
};

const handleCallback = async (req, res, next) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.redirect(
        `${envVars.FRONT_END_URL}/login?googleCalendar=failed&error=missing_params`
      );
    }

    // Split state which was serialized as businessId:branchId:role
    const [businessId, branchId, role] = state.split(":");

    if (!businessId || !branchId || !role) {
      return res.redirect(
        `${envVars.FRONT_END_URL}/login?googleCalendar=failed&error=invalid_state`
      );
    }

    await GoogleCalendarService.handleCallbackService(code, businessId, branchId);

    // Determine front-end redirect path based on role
    const redirectPath = role === "BRANCH_MANAGER" 
      ? "/branch-manager/order-booking" 
      : "/business-owner/order-booking";

    res.redirect(`${envVars.FRONT_END_URL}${redirectPath}?googleCalendar=connected&branchId=${branchId}`);
  } catch (error) {
    console.error("Error in Google Calendar OAuth callback:", error);
    
    // Attempt to parse role from state for correct redirection even on failure
    let redirectPath = "/business-owner/order-booking";
    if (req.query.state) {
      const parts = req.query.state.split(":");
      if (parts[2] === "BRANCH_MANAGER") {
        redirectPath = "/branch-manager/order-booking";
      }
    }

    res.redirect(
      `${envVars.FRONT_END_URL}${redirectPath}?googleCalendar=failed&error=${encodeURIComponent(error.message)}`
    );
  }
};

const getConnectionStatus = async (req, res, next) => {
  try {
    const businessId = req.business.id;
    const { branchId } = req.query;

    if (!branchId) {
      throw new DevBuildError("branchId query parameter is required", StatusCodes.BAD_REQUEST);
    }

    const result = await GoogleCalendarService.getConnectionStatusService(businessId, branchId, req.user);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Connection status retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const disconnectCalendar = async (req, res, next) => {
  try {
    const businessId = req.business.id;
    const { branchId } = req.body;

    if (!branchId) {
      throw new DevBuildError("branchId is required in body", StatusCodes.BAD_REQUEST);
    }

    const result = await GoogleCalendarService.disconnectCalendarService(businessId, branchId, req.user);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Google Calendar disconnected successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const listEvents = async (req, res, next) => {
  try {
    const businessId = req.business.id;
    const { branchId, timeMin, timeMax, maxResults } = req.query;

    if (!branchId) {
      throw new DevBuildError("branchId query parameter is required", StatusCodes.BAD_REQUEST);
    }

    const events = await GoogleCalendarService.listEventsService(businessId, branchId, req.user, {
      timeMin,
      timeMax,
      maxResults,
    });

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Google Calendar events retrieved successfully",
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

const createEvent = async (req, res, next) => {
  try {
    const businessId = req.business.id;
    const { branchId, summary, description, location, startTime, endTime, attendees } = req.body;

    if (!branchId) {
      throw new DevBuildError("branchId is required", StatusCodes.BAD_REQUEST);
    }
    if (!startTime) {
      throw new DevBuildError("startTime is required", StatusCodes.BAD_REQUEST);
    }

    const event = await GoogleCalendarService.createCustomEventService(businessId, branchId, req.user, {
      summary,
      description,
      location,
      startTime,
      endTime,
      attendees,
    });

    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Google Calendar event created successfully",
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

export const GoogleCalendarController = {
  getAuthUrl,
  handleCallback,
  getConnectionStatus,
  disconnectCalendar,
  listEvents,
  createEvent,
};
