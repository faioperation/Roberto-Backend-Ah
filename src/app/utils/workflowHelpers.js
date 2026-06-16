import prisma from "../prisma/client.js";

/**
 * Resolves a workflow stage ID for a given business and type.
 * If stageId is provided, verifies it belongs to this business.
 * If statusName is provided, maps it to a stage name in the active workflow (case-insensitive).
 * If neither is provided or found, uses/creates a default stage.
 */
export const resolveWorkflowStage = async (businessId, type, stageId, statusName) => {
  if (!businessId) return null;

  // 1. If stageId is provided, verify it exists and is under the business's workflow
  if (stageId) {
    const stage = await prisma.workflowStage.findFirst({
      where: {
        id: stageId,
        workflow: { businessId }
      }
    });
    if (stage) return stage.id;
  }

  // 2. Find or create active workflow of this type for this business
  let workflow = await prisma.workflow.findFirst({
    where: { businessId, type, isActive: true },
    include: { stages: { orderBy: { order: "asc" } } }
  });

  if (!workflow) {
    workflow = await prisma.workflow.create({
      data: {
        businessId,
        name: type === "BOOKING" ? "Default Booking Workflow" : "Default CRM Workflow",
        type,
        isActive: true
      },
      include: { stages: { orderBy: { order: "asc" } } }
    });
  }

  // 3. Find or create the stage with statusName
  const cleanStatusName = (statusName || (type === "BOOKING" ? "PENDING" : "NEW")).trim();
  let stage = workflow.stages.find(
    s => s.name.trim().toUpperCase() === cleanStatusName.toUpperCase()
  );

  if (!stage) {
    const nextOrder = workflow.stages.length + 1;
    stage = await prisma.workflowStage.create({
      data: {
        workflowId: workflow.id,
        name: cleanStatusName,
        order: nextOrder,
        color: "#17a2b8" // Default info color
      }
    });
  }

  return stage.id;
};

/**
 * Standardizes booking payload: maps flat properties into `metadata` Json
 * and resolves `stageId` dynamically.
 */
export const extractBookingPayload = async (businessId, payload) => {
  // Normalize snake_case keys to camelCase standard keys
  const normalizedPayload = { ...payload };
  const keyMap = {
    branch_id: "branchId",
    created_by_id: "createdById",
    created_by: "createdById",
    customer_name: "customerName",
    customer_number: "customerNumber",
    payment_status: "paymentStatus",
    payment_method: "paymentMethod",
    order_note: "orderNote",
    stage_id: "stageId",
    order_status: "orderStatus",
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
    "stageId",
    "paymentStatus",
    "paymentMethod",
    "orderNote",
    "metadata"
  ];

  const extracted = {};
  const metadata = normalizedPayload.metadata && typeof normalizedPayload.metadata === "object" ? { ...normalizedPayload.metadata } : {};

  // Extract standard keys
  for (const key of standardKeys) {
    if (key !== "stageId" && key !== "metadata" && normalizedPayload[key] !== undefined) {
      extracted[key] = normalizedPayload[key];
    }
  }

  // Put non-standard fields in metadata (excluding orderStatus/status which are used for workflow resolution and snake_case keys)
  for (const [key, value] of Object.entries(normalizedPayload)) {
    if (!standardKeys.includes(key) && key !== "orderStatus" && key !== "status" && !keyMap[key]) {
      metadata[key] = value;
    }
  }

  // Resolve stageId
  const statusName = normalizedPayload.orderStatus || normalizedPayload.status;
  extracted.stageId = await resolveWorkflowStage(businessId, "BOOKING", normalizedPayload.stageId, statusName);

  // Set price as string since Prisma expects String for price
  if (extracted.price !== undefined) {
    extracted.price = String(extracted.price);
  }

  extracted.metadata = metadata;
  extracted.businessId = businessId;

  return extracted;
};

/**
 * Standardizes CRM Lead payload: maps flat properties into `metadata` Json
 * and resolves `stageId` dynamically.
 */
export const extractLeadPayload = async (businessId, payload) => {
  // Normalize snake_case keys to camelCase standard keys
  const normalizedPayload = { ...payload };
  const keyMap = {
    branch_id: "branchId",
    created_by_id: "createdById",
    created_by: "createdById",
    stage_id: "stageId",
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
    "stageId",
    "name",
    "email",
    "phone",
    "source",
    "address",
    "note",
    "metadata"
  ];

  const extracted = {};
  const metadata = normalizedPayload.metadata && typeof normalizedPayload.metadata === "object" ? { ...normalizedPayload.metadata } : {};

  // Extract standard keys
  for (const key of standardKeys) {
    if (key !== "stageId" && key !== "metadata" && normalizedPayload[key] !== undefined) {
      extracted[key] = normalizedPayload[key];
    }
  }

  // Put non-standard fields in metadata (excluding status which is used for workflow resolution and snake_case keys)
  for (const [key, value] of Object.entries(normalizedPayload)) {
    if (!standardKeys.includes(key) && key !== "status" && !keyMap[key]) {
      metadata[key] = value;
    }
  }

  // Resolve stageId
  extracted.stageId = await resolveWorkflowStage(businessId, "CRM", normalizedPayload.stageId, normalizedPayload.status);

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
