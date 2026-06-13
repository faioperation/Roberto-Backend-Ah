/*
  Warnings:

  - The `business_type` column on the `businesses` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `system_business` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('LAW', 'CARGOS', 'EDUCATION', 'OTHER');

-- DropForeignKey
ALTER TABLE "system_business" DROP CONSTRAINT "system_business_business_owner_id_fkey";

-- DropForeignKey
ALTER TABLE "system_business" DROP CONSTRAINT "system_business_created_by_id_fkey";

-- AlterTable
ALTER TABLE "businesses" ADD COLUMN     "created_by_id" TEXT,
ADD COLUMN     "credits" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "plan_cycle" "BusinessPlanType" NOT NULL DEFAULT 'MONTHLY',
ADD COLUMN     "plan_id" TEXT,
DROP COLUMN "business_type",
ADD COLUMN     "business_type" "BusinessType";

-- DropTable
DROP TABLE "system_business";

-- AddForeignKey
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
