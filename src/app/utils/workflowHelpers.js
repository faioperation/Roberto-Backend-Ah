import prisma from "../prisma/client.js";

/**
 * Standardizes booking payload (simplified for order booking schema).
 */
export const extractBookingPayload = async (businessId, payload) => {
  const normalizedPayload = { ...payload };
  const keyMap = {
    branch_id: "branchId",
    created_by_id: "createdById",
    created_by: "createdById",
    customer_name: "customerName",
    customer_number: "customerNumber",
    note: "note",
    order_note: "note",
  };

  for (const [snakeKey, camelKey] of Object.entries(keyMap)) {
    if (normalizedPayload[snakeKey] !== undefined && normalizedPayload[camelKey] === undefined) {
      normalizedPayload[camelKey] = normalizedPayload[snakeKey];
    }
  }

  const standardKeys = [
    "businessId",
    "branchId",
    "createdById",
    "customerName",
    "customerNumber",
    "email",
    "price",
    "note"
  ];

  const extracted = {};

  // Extract standard keys
  for (const key of standardKeys) {
    if (normalizedPayload[key] !== undefined) {
      extracted[key] = normalizedPayload[key];
    }
  }

  // Set price as string
  if (extracted.price !== undefined) {
    extracted.price = String(extracted.price);
  }

  extracted.businessId = businessId;

  return extracted;
};

/**
 * Standardizes CRM Lead payload.
 */
export const extractLeadPayload = async (businessId, payload) => {
  const normalizedPayload = { ...payload };
  const keyMap = {
    branch_id: "branchId",
    created_by_id: "createdById",
    created_by: "createdById",
  };

  for (const [snakeKey, camelKey] of Object.entries(keyMap)) {
    if (normalizedPayload[snakeKey] !== undefined && normalizedPayload[camelKey] === undefined) {
      normalizedPayload[camelKey] = normalizedPayload[snakeKey];
    }
  }

  const standardKeys = [
    "businessId",
    "createdById",
    "branchId",
    "name",
    "email",
    "phone",
    "source",
    "address",
    "note",
    "status",
    "metadata"
  ];

  const extracted = {};
  const metadata = normalizedPayload.metadata && typeof normalizedPayload.metadata === "object" ? { ...normalizedPayload.metadata } : {};

  // Extract standard keys
  for (const key of standardKeys) {
    if (key !== "metadata" && normalizedPayload[key] !== undefined) {
      extracted[key] = normalizedPayload[key];
    }
  }

  // Put non-standard fields in metadata
  for (const [key, value] of Object.entries(normalizedPayload)) {
    if (!standardKeys.includes(key) && !keyMap[key]) {
      metadata[key] = value;
    }
  }

  if (extracted.status) {
    const statusUpper = String(extracted.status).toUpperCase();
    if (["COLD", "WARM", "BOOKED", "HOT"].includes(statusUpper)) {
      extracted.status = statusUpper;
    } else {
      extracted.status = "COLD";
    }
  }

  const validSources = [
    "WEBSITE",
    "SOCIAL_MEDIA",
    "REFERRAL",
    "COLD_CALL",
    "OTHER",
    "WHATSAPP",
    "MESSENGER",
    "INSTAGRAM"
  ];

  if (extracted.source) {
    const sourceUpper = String(extracted.source).toUpperCase().replace(/[-\s]/g, "_");
    if (validSources.includes(sourceUpper)) {
      extracted.source = sourceUpper;
    } else {
      extracted.source = "COLD_CALL";
    }
  } else {
    extracted.source = "COLD_CALL";
  }

  if (extracted.source === "COLD_CALL") {
    const customerPhone = metadata.customer_phone || normalizedPayload.customer_phone || metadata.customerPhone || normalizedPayload.customerPhone;
    if (customerPhone) {
      extracted.phone = customerPhone;
    }
  }

  extracted.metadata = metadata;
  extracted.businessId = businessId;

  return extracted;
};

/**
 * Resolves the businessId and branchId associated with the logged-in user.
 */
export const getBusinessAndBranchForUser = async (user) => {
  if (!user) return { businessId: null, branchId: null, isOwner: false };
  const userRoleNames = user.roles?.map(r => r.role?.name || r.role) || [];
  const isBusinessOwner = userRoleNames.includes("BUSINESS_OWNER");
  const isBranchManager = userRoleNames.includes("BRANCH_MANAGER");

  if (isBusinessOwner) {
    const business = await prisma.business.findFirst({ where: { ownerId: user.id } });
    return { businessId: business?.id || null, branchId: null, isOwner: true };
  } else if (isBranchManager) {
    const managerRecord = await prisma.branchManager.findUnique({
      where: { email: user.email }
    });
    if (managerRecord) {
      const branch = await prisma.branch.findFirst({
        where: { managerId: managerRecord.id }
      });
      return { 
        businessId: managerRecord.businessId, 
        branchId: branch?.id || null, 
        isOwner: false 
      };
    }
  }
  return { businessId: null, branchId: null, isOwner: false };
};
