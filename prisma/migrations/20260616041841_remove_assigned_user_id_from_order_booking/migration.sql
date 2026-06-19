/*
  Warnings:

  - You are about to drop the column `assigned_user_id` on the `order_bookings` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "order_bookings" DROP CONSTRAINT "order_bookings_assigned_user_id_fkey";

-- AlterTable
ALTER TABLE "order_bookings" DROP COLUMN "assigned_user_id";
