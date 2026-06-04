-- CreateEnum
CREATE TYPE "BranchManagerStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- AlterTable
ALTER TABLE "system_business" ADD COLUMN     "business_owner_id" TEXT;

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

-- CreateIndex
CREATE UNIQUE INDEX "branch_managers_email_key" ON "branch_managers"("email");

-- AddForeignKey
ALTER TABLE "system_business" ADD CONSTRAINT "system_business_business_owner_id_fkey" FOREIGN KEY ("business_owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_managers" ADD CONSTRAINT "branch_managers_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_managers" ADD CONSTRAINT "branch_managers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
