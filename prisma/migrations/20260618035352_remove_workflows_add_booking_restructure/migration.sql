/*
  Warnings:

  - You are about to drop the column `stage_id` on the `crm_leads` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `order_bookings` table. All the data in the column will be lost.
  - You are about to drop the column `order_note` on the `order_bookings` table. All the data in the column will be lost.
  - You are about to drop the column `payment_method` on the `order_bookings` table. All the data in the column will be lost.
  - You are about to drop the column `payment_status` on the `order_bookings` table. All the data in the column will be lost.
  - You are about to drop the column `stage_id` on the `order_bookings` table. All the data in the column will be lost.
  - You are about to drop the `workflow_stages` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `workflows` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('ORDER_BOOKING', 'APPOINTMENT_BOOKING', 'PARCEL_DELIVERY');

-- CreateEnum
CREATE TYPE "FeatureName" AS ENUM ('ORDER_BOOKING', 'APPOINTMENT_BOOKING', 'PARCEL_DELIVERY');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('COLD', 'WARM', 'BOOKED', 'HOT');

-- DropForeignKey
ALTER TABLE "crm_leads" DROP CONSTRAINT "crm_leads_stage_id_fkey";

-- DropForeignKey
ALTER TABLE "order_bookings" DROP CONSTRAINT "order_bookings_stage_id_fkey";

-- DropForeignKey
ALTER TABLE "workflow_stages" DROP CONSTRAINT "workflow_stages_workflow_id_fkey";

-- DropForeignKey
ALTER TABLE "workflows" DROP CONSTRAINT "workflows_business_id_fkey";

-- AlterTable
ALTER TABLE "agents" ADD COLUMN     "branch_id" TEXT;

-- AlterTable
ALTER TABLE "businesses" ADD COLUMN     "business_type" "BusinessType";

-- AlterTable
ALTER TABLE "crm_leads" DROP COLUMN "stage_id",
ADD COLUMN     "status" "LeadStatus" NOT NULL DEFAULT 'COLD';

-- AlterTable
ALTER TABLE "order_bookings" DROP COLUMN "metadata",
DROP COLUMN "order_note",
DROP COLUMN "payment_method",
DROP COLUMN "payment_status",
DROP COLUMN "stage_id",
ADD COLUMN     "note" TEXT;

-- DropTable
DROP TABLE "workflow_stages";

-- DropTable
DROP TABLE "workflows";

-- DropEnum
DROP TYPE "PaymentMethod";

-- DropEnum
DROP TYPE "WorkflowType";

-- CreateTable
CREATE TABLE "order_details" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "order_id" TEXT NOT NULL,
    "delivery_date" TEXT,
    "delivery_address" TEXT,
    "product_type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "order_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment_bookings" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "created_by" TEXT,
    "customer_name" TEXT NOT NULL,
    "customer_number" TEXT NOT NULL,
    "email" TEXT,
    "price" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "appointment_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment_details" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "appointment_id" TEXT NOT NULL,
    "appointment_date" TEXT,
    "appointment_time" TIMESTAMP(3),
    "platform" TEXT,
    "duration" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "appointment_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parcel_deliveries" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "created_by" TEXT,
    "customer_name" TEXT NOT NULL,
    "customer_number" TEXT NOT NULL,
    "email" TEXT,
    "price" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "parcel_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parcel_details" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "parcel_delivery_id" TEXT NOT NULL,
    "pickup_address" TEXT,
    "delivery_date" TEXT,
    "delivery_address" TEXT,
    "product_type" TEXT,
    "product_height" TEXT,
    "product_weight" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "parcel_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "features" (
    "id" TEXT NOT NULL,
    "feature_name" "FeatureName" NOT NULL,

    CONSTRAINT "features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "additional_details" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "feature_id" TEXT,
    "reference_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "additional_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_details" (
    "id" TEXT NOT NULL,
    "reference_id" TEXT NOT NULL,
    "created_by" TEXT,
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "payment_method" TEXT,
    "transaction_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "payment_details_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "order_details_order_id_key" ON "order_details"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "appointment_details_appointment_id_key" ON "appointment_details"("appointment_id");

-- CreateIndex
CREATE UNIQUE INDEX "parcel_details_parcel_delivery_id_key" ON "parcel_details"("parcel_delivery_id");

-- AddForeignKey
ALTER TABLE "order_details" ADD CONSTRAINT "order_details_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_bookings" ADD CONSTRAINT "appointment_bookings_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_bookings" ADD CONSTRAINT "appointment_bookings_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_bookings" ADD CONSTRAINT "appointment_bookings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_details" ADD CONSTRAINT "appointment_details_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointment_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcel_deliveries" ADD CONSTRAINT "parcel_deliveries_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcel_deliveries" ADD CONSTRAINT "parcel_deliveries_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcel_deliveries" ADD CONSTRAINT "parcel_deliveries_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcel_details" ADD CONSTRAINT "parcel_details_parcel_delivery_id_fkey" FOREIGN KEY ("parcel_delivery_id") REFERENCES "parcel_deliveries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "additional_details" ADD CONSTRAINT "additional_details_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "features"("id") ON DELETE SET NULL ON UPDATE CASCADE;
