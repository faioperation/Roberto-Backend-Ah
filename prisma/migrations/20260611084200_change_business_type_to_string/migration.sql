-- AlterTable
ALTER TABLE "businesses" DROP COLUMN IF EXISTS "type";
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "business_type" TEXT;

-- AlterTable
ALTER TABLE "system_business" ALTER COLUMN "business_type" SET DATA TYPE TEXT;
ALTER TABLE "system_business" ALTER COLUMN "business_type" SET DEFAULT 'Other';
ALTER TABLE "system_business" ALTER COLUMN "business_type" DROP NOT NULL;

-- DropEnum
DROP TYPE IF EXISTS "BusinessType";
