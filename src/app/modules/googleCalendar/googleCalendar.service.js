import { google } from "googleapis";
import prisma from "../../prisma/client.js";
import { envVars } from "../../config/env.js";
import DevBuildError from "../../lib/DevBuildError.js";
import { StatusCodes } from "http-status-codes";

/**
 * Creates an instance of Google OAuth2 client
 */
const getOAuth2Client = () => {
  return new google.auth.OAuth2(
    envVars.GOOGLE_CALENDAR_CLIENT_ID,
    envVars.GOOGLE_CALENDAR_CLIENT_SECRET,
    envVars.GOOGLE_CALENDAR_REDIRECT_URI
  );
};

/**
 * Validates that the branch exists under the business, and if the user is a branch manager, checks if they manage this branch.
 */
const validateBranchAccess = async (businessId, branchId, user) => {
  const branch = await prisma.branch.findFirst({
    where: { id: branchId, businessId }
  });
  if (!branch) {
    throw new DevBuildError("Branch not found or unauthorized", StatusCodes.NOT_FOUND);
  }

  const userRoleNames = user.roles?.map(r => r.role.name) || [];
  const isBranchManager = userRoleNames.includes("BRANCH_MANAGER");
  
  if (isBranchManager) {
    const managerRecord = await prisma.branchManager.findUnique({
      where: { email: user.email },
      include: { branches: true }
    });
    
    const managedBranchIds = managerRecord?.branches.map(b => b.id) || [];
    if (!managedBranchIds.includes(branchId)) {
      throw new DevBuildError("Unauthorized: You do not manage this branch", StatusCodes.FORBIDDEN);
    }
  }
};

/**
 * Generates the Google OAuth authorization URL for a branch
 * @param {string} businessId 
 * @param {string} branchId 
 * @param {object} user
 * @param {string} role 
 * @returns {string} url
 */
const getAuthUrlService = async (businessId, branchId, user, role) => {
  await validateBranchAccess(businessId, branchId, user);

  const oauth2Client = getOAuth2Client();

  const scopes = [
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/userinfo.email"
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    state: `${businessId}:${branchId}:${role}`,
    prompt: "consent" // Force to return refresh token on every authentication
  });

  return url;
};

/**
 * Handles the OAuth callback, exchanges authorization code for tokens, and saves them
 * @param {string} code 
 * @param {string} businessId 
 * @param {string} branchId 
 */
const handleCallbackService = async (code, businessId, branchId) => {
  const oauth2Client = getOAuth2Client();

  // Exchange auth code for tokens
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  // Fetch the email of the authenticated user
  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
  const userInfoResponse = await oauth2.userinfo.get();
  const email = userInfoResponse.data.email;

  if (!email) {
    throw new DevBuildError("Failed to retrieve Google user email", StatusCodes.BAD_REQUEST);
  }

  const expiryDate = tokens.expiry_date ? new Date(tokens.expiry_date) : null;

  // Save the tokens in the database, uniquely per branch
  const connection = await prisma.googleCalendarConnection.upsert({
    where: { branchId },
    update: {
      email,
      accessToken: tokens.access_token,
      ...(tokens.refresh_token && { refreshToken: tokens.refresh_token }),
      tokenExpiry: expiryDate,
    },
    create: {
      businessId,
      branchId,
      email,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || "",
      tokenExpiry: expiryDate,
    }
  });

  return connection;
};

/**
 * Prepares OAuth2 client with auto-refresh mechanism
 * @param {object} connection 
 * @returns {object} oauth2Client
 */
const getAuthenticatedClient = async (connection) => {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: connection.accessToken,
    refresh_token: connection.refreshToken,
    expiry_date: connection.tokenExpiry ? connection.tokenExpiry.getTime() : null,
  });

  // Listen for automatic token refresh events and save to DB
  oauth2Client.on("tokens", async (newTokens) => {
    const updateData = {};
    if (newTokens.access_token) {
      updateData.accessToken = newTokens.access_token;
    }
    if (newTokens.expiry_date) {
      updateData.tokenExpiry = new Date(newTokens.expiry_date);
    }
    if (newTokens.refresh_token) {
      updateData.refreshToken = newTokens.refresh_token;
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.googleCalendarConnection.update({
        where: { branchId: connection.branchId },
        data: updateData,
      }).catch(err => console.error("Failed to update refreshed Google Calendar tokens:", err));
    }
  });

  // Check if token is expired or close to expiry (within 5 minutes), force a refresh
  const isExpired = connection.tokenExpiry && (connection.tokenExpiry.getTime() - Date.now() < 300000);
  if (isExpired && connection.refreshToken) {
    try {
      const refreshed = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(refreshed.credentials);
    } catch (error) {
      console.error("Error refreshing access token manually:", error);
    }
  }

  return oauth2Client;
};

/**
 * Builds an all-day event start/end block from a date value.
 */
const buildAllDayEvent = (dateValue) => {
  const startTime = new Date(dateValue);
  const nextDay = new Date(startTime);
  nextDay.setDate(nextDay.getDate() + 1);
  const fmt = (d) => d.toISOString().split("T")[0];
  return {
    start: { date: fmt(startTime) },
    end: { date: fmt(nextDay) },
  };
};

/**
 * Creates Google Calendar event for any booking category.
 * Supports: APPOINTMENT_BOOKING, ORDER_BOOKING, PARCEL_DELIVERY
 * @param {object} booking - Booking object from DB (with its details relation attached)
 * @param {object} connection - Google Calendar connection details
 * @param {string} [businessType] - Optional override; auto-detected from booking shape if omitted
 */
const createEventForBooking = async (booking, connection, businessType) => {
  const oauth2Client = await getAuthenticatedClient(connection);
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const baseAttendees = booking.email ? [{ email: booking.email }] : [];
  const baseNote = `Customer Phone: ${booking.customerNumber}\nCustomer Email: ${booking.email || "N/A"}\nNotes: ${booking.note || "N/A"}`;

  let eventResource;

  // ── APPOINTMENT BOOKING ────────────────────────────────────────────────────
  if (businessType === "APPOINTMENT_BOOKING" || booking.appointmentDetails) {
    const details = booking.appointmentDetails;
    if (!details || (!details.appointmentTime && !details.appointmentDate)) {
      console.log("No appointment time or date found. Skipping calendar event creation.");
      return;
    }

    let timePart;
    if (details.appointmentTime) {
      const startTime = new Date(details.appointmentTime);

      // Parse duration string e.g. "30 mins", "1 hour". Default 60 mins.
      let durationMinutes = 60;
      const durationStr = details.duration;
      if (durationStr) {
        const match = durationStr.match(/(\d+)/);
        if (match) {
          const n = parseInt(match[1], 10);
          durationMinutes = durationStr.toLowerCase().includes("hour") ? n * 60 : n;
        }
      }
      const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
      timePart = {
        start: { dateTime: startTime.toISOString(), timeZone: "UTC" },
        end: { dateTime: endTime.toISOString(), timeZone: "UTC" },
      };
    } else {
      timePart = buildAllDayEvent(details.appointmentDate);
    }

    eventResource = {
      summary: `Appointment: ${booking.customerName}`,
      location: details.platform || "Physical Location / Not Specified",
      description: `${baseNote}\nPlatform: ${details.platform || "N/A"}\nDuration: ${details.duration || "N/A"}`,
      attendees: baseAttendees,
      reminders: { useDefault: true },
      ...timePart,
    };

  // ── PARCEL DELIVERY ────────────────────────────────────────────────────────
  } else if (businessType === "PARCEL_DELIVERY" || booking.parcelDetails) {
    const details = booking.parcelDetails;
    if (!details?.deliveryDate) {
      console.log("No delivery date for parcel. Skipping calendar event creation.");
      return;
    }

    eventResource = {
      ...buildAllDayEvent(details.deliveryDate),
      summary: `Parcel Delivery: ${booking.customerName}`,
      location: details.deliveryAddress || "Not Specified",
      description: `${baseNote}\nPickup: ${details.pickupAddress || "N/A"}\nDelivery Address: ${details.deliveryAddress || "N/A"}\nProduct Type: ${details.productType || "N/A"}\nWeight: ${details.productWeight ?? "N/A"}`,
      attendees: baseAttendees,
      reminders: { useDefault: true },
    };

  // ── ORDER BOOKING (default) ────────────────────────────────────────────────
  } else {
    const details = booking.orderDetails;
    if (!details?.deliveryDate) {
      console.log("No delivery date for order. Skipping calendar event creation.");
      return;
    }

    eventResource = {
      ...buildAllDayEvent(details.deliveryDate),
      summary: `Order: ${booking.customerName}`,
      location: details.deliveryAddress || "Not Specified",
      description: `${baseNote}\nDelivery Address: ${details.deliveryAddress || "N/A"}\nProduct Type: ${details.productType || "N/A"}`,
      attendees: baseAttendees,
      reminders: { useDefault: true },
    };
  }

  try {
    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: eventResource,
    });
    console.log(`Google Calendar event created for branch ${connection.branchId}: ${response.data.htmlLink}`);
    return response.data;
  } catch (error) {
    console.error("Error creating Google Calendar event:", error);
    throw error;
  }
};

/**
 * Automatically syncs any booking to Google Calendar if a connection exists for the branch.
 * Supports APPOINTMENT_BOOKING, ORDER_BOOKING, and PARCEL_DELIVERY.
 * @param {object} booking - Booking object (may or may not have details already attached)
 */
const syncBookingToCalendar = async (booking) => {
  if (!booking.branchId) return;

  // Resolve businessType from the business record if not already on the object
  let businessType = booking.businessType;
  if (!businessType) {
    const business = await prisma.business.findUnique({
      where: { id: booking.businessId },
      select: { businessType: true },
    });
    businessType = business?.businessType || "ORDER_BOOKING";
  }

  // Fetch details if not already attached
  let fullBooking = { ...booking, businessType };

  if (businessType === "APPOINTMENT_BOOKING" && !booking.appointmentDetails) {
    const details = await prisma.appointmentDetails.findUnique({
      where: { appointmentId: booking.id },
    });
    if (!details) {
      console.log(`No appointmentDetails found for booking ${booking.id}. Skipping.`);
      return;
    }
    fullBooking.appointmentDetails = details;

  } else if (businessType === "PARCEL_DELIVERY" && !booking.parcelDetails) {
    const details = await prisma.parcelDetails.findUnique({
      where: { parcelDeliveryId: booking.id },
    });
    if (!details) {
      console.log(`No parcelDetails found for booking ${booking.id}. Skipping.`);
      return;
    }
    fullBooking.parcelDetails = details;

  } else if (businessType === "ORDER_BOOKING" && !booking.orderDetails) {
    const details = await prisma.orderDetails.findUnique({
      where: { orderId: booking.id },
    });
    if (!details) {
      console.log(`No orderDetails found for booking ${booking.id}. Skipping.`);
      return;
    }
    fullBooking.orderDetails = details;
  }

  try {
    const connection = await prisma.googleCalendarConnection.findUnique({
      where: { branchId: booking.branchId },
    });
    if (connection) {
      await createEventForBooking(fullBooking, connection, businessType);
    }
  } catch (err) {
    console.error("Failed to sync booking to Google Calendar automatically:", err);
  }
};

/**
 * Creates a custom Google Calendar event for a branch
 * @param {string} businessId 
 * @param {string} branchId 
 * @param {object} user
 * @param {object} eventData
 */
const createCustomEventService = async (businessId, branchId, user, eventData) => {
  await validateBranchAccess(businessId, branchId, user);

  const connection = await prisma.googleCalendarConnection.findUnique({
    where: { branchId }
  });
  if (!connection) {
    throw new DevBuildError("Google Calendar is not connected for this branch", StatusCodes.BAD_REQUEST);
  }

  const oauth2Client = await getAuthenticatedClient(connection);
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const start = new Date(eventData.startTime);
  if (isNaN(start.getTime())) {
    throw new DevBuildError("Invalid startTime format", StatusCodes.BAD_REQUEST);
  }

  let end;
  if (eventData.endTime) {
    end = new Date(eventData.endTime);
    if (isNaN(end.getTime())) {
      throw new DevBuildError("Invalid endTime format", StatusCodes.BAD_REQUEST);
    }
  } else {
    // Default: 1 hour duration
    end = new Date(start.getTime() + 60 * 60 * 1000);
  }

  const eventResource = {
    summary: eventData.summary || "Custom Event",
    location: eventData.location || "",
    description: eventData.description || "",
    start: {
      dateTime: start.toISOString(),
      timeZone: "UTC",
    },
    end: {
      dateTime: end.toISOString(),
      timeZone: "UTC",
    },
    attendees: Array.isArray(eventData.attendees) 
      ? eventData.attendees.map(email => ({ email })) 
      : [],
    reminders: {
      useDefault: true,
    },
  };

  try {
    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: eventResource,
    });
    return response.data;
  } catch (error) {
    console.error("Error creating custom Google Calendar event:", error);
    throw error;
  }
};

/**
 * Retrieves connection status for a branch
 * @param {string} businessId 
 * @param {string} branchId 
 * @param {object} user
 */
const getConnectionStatusService = async (businessId, branchId, user) => {
  await validateBranchAccess(businessId, branchId, user);

  const connection = await prisma.googleCalendarConnection.findUnique({
    where: { branchId }
  });

  return {
    isConnected: !!connection,
    email: connection?.email || null,
  };
};

/**
 * Disconnects Google Calendar connection for a branch
 * @param {string} businessId 
 * @param {string} branchId 
 * @param {object} user
 */
const disconnectCalendarService = async (businessId, branchId, user) => {
  await validateBranchAccess(businessId, branchId, user);

  const connection = await prisma.googleCalendarConnection.findUnique({
    where: { branchId }
  });
  if (!connection) {
    throw new DevBuildError("Google Calendar is not connected for this branch", StatusCodes.BAD_REQUEST);
  }

  // Revoke credentials on Google side
  try {
    const oauth2Client = getOAuth2Client();
    await oauth2Client.revokeToken(connection.accessToken);
  } catch (err) {
    console.error("Failed to revoke Google token on disconnect:", err.message);
  }

  // Delete from DB
  await prisma.googleCalendarConnection.delete({
    where: { branchId }
  });

  return { success: true };
};

/**
 * Lists calendar events from a connected branch's Google Calendar
 * @param {string} businessId 
 * @param {string} branchId 
 * @param {object} user
 * @param {object} query 
 */
const listEventsService = async (businessId, branchId, user, query = {}) => {
  await validateBranchAccess(businessId, branchId, user);

  const connection = await prisma.googleCalendarConnection.findUnique({
    where: { branchId }
  });
  if (!connection) {
    throw new DevBuildError("Google Calendar is not connected for this branch", StatusCodes.BAD_REQUEST);
  }

  const oauth2Client = await getAuthenticatedClient(connection);
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const listParams = {
    calendarId: "primary",
    singleEvents: true,
    orderBy: "startTime",
    maxResults: query.maxResults ? parseInt(query.maxResults, 10) : 100,
  };

  if (query.timeMin) {
    listParams.timeMin = new Date(query.timeMin).toISOString();
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    listParams.timeMin = today.toISOString();
  }

  if (query.timeMax) {
    listParams.timeMax = new Date(query.timeMax).toISOString();
  }

  try {
    const response = await calendar.events.list(listParams);
    return response.data.items || [];
  } catch (error) {
    console.error("Error fetching Google Calendar events:", error);
    throw error;
  }
};

export const GoogleCalendarService = {
  getAuthUrlService,
  handleCallbackService,
  createEventForBooking,
  syncBookingToCalendar,
  createCustomEventService,
  getConnectionStatusService,
  disconnectCalendarService,
  listEventsService,
};
