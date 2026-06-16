/*
  Warnings:

  - You are about to drop the column `business_type` on the `businesses` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `crm_leads` table. All the data in the column will be lost.
  - You are about to drop the column `address` on the `order_bookings` table. All the data in the column will be lost.
  - You are about to drop the column `delivery_from_address` on the `order_bookings` table. All the data in the column will be lost.
  - You are about to drop the column `delivery_time` on the `order_bookings` table. All the data in the column will be lost.
  - You are about to drop the column `order_status` on the `order_bookings` table. All the data in the column will be lost.
  - You are about to drop the column `product_name` on the `order_bookings` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `order_bookings` table. All the data in the column will be lost.
  - You are about to drop the column `shipping_charge` on the `order_bookings` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `order_bookings` table. All the data in the column will be lost.
  - Added the required column `stage_id` to the `order_bookings` table without a default value. This is not possible if the table is not empty.
  - Made the column `type` on table `pricings` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `configuration` to the `pricings` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "WorkflowType" AS ENUM ('BOOKING', 'CRM');

-- AlterTable
ALTER TABLE "businesses" DROP COLUMN "business_type",
ADD COLUMN     "industry" TEXT;

-- AlterTable
ALTER TABLE "crm_leads" DROP COLUMN "status",
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "stage_id" TEXT;

-- AlterTable
ALTER TABLE "order_bookings" DROP COLUMN "address",
DROP COLUMN "delivery_from_address",
DROP COLUMN "delivery_time",
DROP COLUMN "order_status",
DROP COLUMN "product_name",
DROP COLUMN "quantity",
DROP COLUMN "shipping_charge",
DROP COLUMN "size",
ADD COLUMN     "assigned_user_id" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "stage_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "pricings" ALTER COLUMN "type" SET NOT NULL,
DROP COLUMN "configuration",
ADD COLUMN     "configuration" JSONB NOT NULL;

-- DropEnum
DROP TYPE "BusinessType";

-- DropEnum
DROP TYPE "CrmStatus";

-- DropEnum
DROP TYPE "OrderStatus";

-- CreateTable
CREATE TABLE "workflows" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "WorkflowType" NOT NULL DEFAULT 'BOOKING',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_stages" (
    "id" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "color" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "target_table" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "old_values" JSONB,
    "new_values" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_summaries" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "items" TEXT,
    "pickup_area" TEXT,
    "destination" TEXT,
    "weight" TEXT,
    "pickup_date_time" TEXT,
    "current_status" TEXT,
    "recent_summary" TEXT,
    "booking_info" JSONB,
    "summary" TEXT,
    "key_points" TEXT[],
    "intent" TEXT,
    "confidence" TEXT,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chat_summaries_conversation_id_key" ON "chat_summaries"("conversation_id");

-- AddForeignKey
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_stages" ADD CONSTRAINT "workflow_stages_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_bookings" ADD CONSTRAINT "order_bookings_assigned_user_id_fkey" FOREIGN KEY ("assigned_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_bookings" ADD CONSTRAINT "order_bookings_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "workflow_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_leads" ADD CONSTRAINT "crm_leads_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "workflow_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_summaries" ADD CONSTRAINT "chat_summaries_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
