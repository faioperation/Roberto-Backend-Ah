-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING');

-- CreateEnum
CREATE TYPE "BusinessStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING');

-- CreateEnum
CREATE TYPE "RoleName" AS ENUM ('SYSTEM_OWNER', 'BUSINESS_OWNER', 'BRANCH_MANAGER', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "DemoBookingStatus" AS ENUM ('CALLED', 'PENDING');

-- CreateEnum
CREATE TYPE "PlanName" AS ENUM ('NORMAL', 'MEDIUM', 'PREMIUM');

-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('YEARLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('Retail', 'Service', 'Manufacturing', 'Tech', 'Other');

-- CreateEnum
CREATE TYPE "BusinessPlanType" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "BranchManagerStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH_ON_DELIVERY', 'ONLINE_PAYMENT', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "SourceEnum" AS ENUM ('WEBSITE', 'SOCIAL_MEDIA', 'REFERRAL', 'COLD_CALL', 'OTHER');

-- CreateEnum
CREATE TYPE "CrmStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "WhatsappAccountStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DISCONNECTED');

-- CreateEnum
CREATE TYPE "WhatsappMessageDirection" AS ENUM ('INCOMING', 'OUTGOING');

-- CreateEnum
CREATE TYPE "WhatsappMessageStatus" AS ENUM ('SENT', 'DELIVERED', 'READ', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "profile_picture" TEXT,
    "gender" TEXT,
    "country" TEXT,
    "phone" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "forgot_password_status" BOOLEAN NOT NULL DEFAULT false,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" "RoleName" NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demo_booking" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "mobile_number" TEXT,
    "date" DATE,
    "status" "DemoBookingStatus" NOT NULL DEFAULT 'PENDING',
    "credits" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "demo_booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_owner_plan" (
    "id" TEXT NOT NULL,
    "name" "PlanName" NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "billing_cycle" "PlanType" NOT NULL DEFAULT 'MONTHLY',
    "plan_list" TEXT[],
    "created_by_id" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_owner_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_business" (
    "id" TEXT NOT NULL,
    "business_name" TEXT NOT NULL,
    "business_type" "BusinessType" NOT NULL DEFAULT 'Other',
    "description" TEXT,
    "owner_name" TEXT,
    "owner_email" TEXT,
    "owner_password" TEXT,
    "owner_phone" TEXT,
    "selected_branch" TEXT,
    "plan_id" TEXT,
    "plan_cycle" "BusinessPlanType" NOT NULL DEFAULT 'MONTHLY',
    "status" "BusinessStatus" NOT NULL DEFAULT 'INACTIVE',
    "created_by_id" TEXT,
    "business_owner_id" TEXT,
    "credits" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_log" (
    "id" TEXT NOT NULL,
    "activity_name" TEXT,
    "activity_title" TEXT,
    "activity_type" TEXT,
    "mark_as_read" BOOLEAN NOT NULL DEFAULT false,
    "created_by_id" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "monthlyPrice" DOUBLE PRECISION NOT NULL,
    "yearlyPrice" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionFeature" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "businesses" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "country" TEXT,
    "address" TEXT,
    "status" "BusinessStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branches" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "manager_id" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branch_managers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "status" "BranchManagerStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_by" TEXT,
    "business_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "branch_managers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_bookings" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "created_by" TEXT,
    "customer_name" TEXT NOT NULL,
    "customer_number" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT NOT NULL,
    "delivery_from_address" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "quantity" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "order_status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "shipping_charge" TEXT NOT NULL,
    "delivery_time" TIMESTAMP(3) NOT NULL,
    "order_note" TEXT,
    "payment_method" "PaymentMethod",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "order_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricings" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "created_by" TEXT,
    "branch_id" TEXT,
    "rule_name" TEXT NOT NULL,
    "type" TEXT,
    "configuration" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "pricings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_leads" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "created_by" TEXT,
    "branch_id" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "source" "SourceEnum",
    "status" "CrmStatus",
    "address" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "crm_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_connections" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "provider" TEXT NOT NULL,
    "page_id" TEXT NOT NULL,
    "page_name" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "token_expiry" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "ai_reply" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "platform" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "customer_name" TEXT,
    "last_message" TEXT,
    "last_message_at" TIMESTAMP(3),
    "ai_reply" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "senderType" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "type" TEXT DEFAULT 'text',
    "message_text" TEXT,
    "media_url" TEXT,
    "file_path" TEXT,
    "platform_message_id" TEXT,
    "raw_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_accounts" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "waba_id" TEXT NOT NULL,
    "phone_number_id" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "status" "WhatsappAccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "ai_reply" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_contacts" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "whatsapp_account_id" TEXT NOT NULL,
    "wa_user_id" TEXT NOT NULL,
    "name" TEXT,
    "phone_number" TEXT NOT NULL,
    "profile_picture" TEXT,
    "last_message_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_conversations" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "whatsapp_account_id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "last_message_id" TEXT,
    "unread_count" INTEGER NOT NULL DEFAULT 0,
    "last_message_at" TIMESTAMP(3),
    "ai_reply" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_messages" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "whatsapp_account_id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "meta_message_id" TEXT,
    "direction" "WhatsappMessageDirection" NOT NULL,
    "type" TEXT NOT NULL,
    "text" TEXT,
    "media_url" TEXT,
    "status" "WhatsappMessageStatus",
    "raw_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_training" (
    "id" TEXT NOT NULL,
    "system_prompt" TEXT,
    "business_information" TEXT,
    "product_information" JSONB,
    "policies_guidelines" JSONB,
    "faq" JSONB,
    "business_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "agent_training_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_id_key" ON "user_roles"("user_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_id_permission_id_key" ON "role_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "demo_booking_email_key" ON "demo_booking"("email");

-- CreateIndex
CREATE UNIQUE INDEX "system_owner_plan_name_key" ON "system_owner_plan"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_slug_key" ON "SubscriptionPlan"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "branch_managers_email_key" ON "branch_managers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_business_id_platform_customer_id_key" ON "conversations"("business_id", "platform", "customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "messages_platform_message_id_key" ON "messages"("platform_message_id");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_accounts_business_id_phone_number_id_key" ON "whatsapp_accounts"("business_id", "phone_number_id");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_contacts_business_id_wa_user_id_key" ON "whatsapp_contacts"("business_id", "wa_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_conversations_business_id_contact_id_key" ON "whatsapp_conversations"("business_id", "contact_id");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_messages_meta_message_id_key" ON "whatsapp_messages"("meta_message_id");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_owner_plan" ADD CONSTRAINT "system_owner_plan_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_business" ADD CONSTRAINT "system_business_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_business" ADD CONSTRAINT "system_business_business_owner_id_fkey" FOREIGN KEY ("business_owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionPlan" ADD CONSTRAINT "SubscriptionPlan_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionFeature" ADD CONSTRAINT "SubscriptionFeature_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "branch_managers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_managers" ADD CONSTRAINT "branch_managers_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_managers" ADD CONSTRAINT "branch_managers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_bookings" ADD CONSTRAINT "order_bookings_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_bookings" ADD CONSTRAINT "order_bookings_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_bookings" ADD CONSTRAINT "order_bookings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricings" ADD CONSTRAINT "pricings_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricings" ADD CONSTRAINT "pricings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricings" ADD CONSTRAINT "pricings_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_leads" ADD CONSTRAINT "crm_leads_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_leads" ADD CONSTRAINT "crm_leads_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_leads" ADD CONSTRAINT "crm_leads_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_connections" ADD CONSTRAINT "social_connections_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_connections" ADD CONSTRAINT "social_connections_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_accounts" ADD CONSTRAINT "whatsapp_accounts_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_contacts" ADD CONSTRAINT "whatsapp_contacts_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_contacts" ADD CONSTRAINT "whatsapp_contacts_whatsapp_account_id_fkey" FOREIGN KEY ("whatsapp_account_id") REFERENCES "whatsapp_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_conversations" ADD CONSTRAINT "whatsapp_conversations_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_conversations" ADD CONSTRAINT "whatsapp_conversations_whatsapp_account_id_fkey" FOREIGN KEY ("whatsapp_account_id") REFERENCES "whatsapp_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_conversations" ADD CONSTRAINT "whatsapp_conversations_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "whatsapp_contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_whatsapp_account_id_fkey" FOREIGN KEY ("whatsapp_account_id") REFERENCES "whatsapp_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "whatsapp_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "whatsapp_contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
