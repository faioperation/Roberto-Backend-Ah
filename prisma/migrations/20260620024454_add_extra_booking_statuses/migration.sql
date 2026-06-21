-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BookingStatus" ADD VALUE 'PROCESSING';
ALTER TYPE "BookingStatus" ADD VALUE 'CHECKED_IN';
ALTER TYPE "BookingStatus" ADD VALUE 'PICKUP_PENDING';
ALTER TYPE "BookingStatus" ADD VALUE 'PICKED_UP';
ALTER TYPE "BookingStatus" ADD VALUE 'IN_TRANSIT';
ALTER TYPE "BookingStatus" ADD VALUE 'OUT_FOR_DELIVERY';
ALTER TYPE "BookingStatus" ADD VALUE 'READY';
ALTER TYPE "BookingStatus" ADD VALUE 'IN_PROGRESS';
ALTER TYPE "BookingStatus" ADD VALUE 'DELIVERED';
ALTER TYPE "BookingStatus" ADD VALUE 'RETURNED';
ALTER TYPE "BookingStatus" ADD VALUE 'RESCHEDULED';
ALTER TYPE "BookingStatus" ADD VALUE 'NO_SHOW';
ALTER TYPE "BookingStatus" ADD VALUE 'ON_HOLD';
ALTER TYPE "BookingStatus" ADD VALUE 'REJECTED';
ALTER TYPE "BookingStatus" ADD VALUE 'REFUNDED';
ALTER TYPE "BookingStatus" ADD VALUE 'FAILED';
