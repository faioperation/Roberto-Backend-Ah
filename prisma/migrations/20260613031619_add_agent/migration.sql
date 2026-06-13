-- CreateTable
CREATE TABLE "agents" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "rules_file" TEXT NOT NULL,
    "vapi_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);
