-- Add payment frequency support to bookings table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- Add paymentFrequency column to bookings (default: HOURLY)
ALTER TABLE "bookings" 
ADD COLUMN IF NOT EXISTS "paymentFrequency" TEXT DEFAULT 'HOURLY';

-- Update existing records to use HOURLY if paymentFrequency is NULL
UPDATE "bookings" SET "paymentFrequency" = 'HOURLY' WHERE "paymentFrequency" IS NULL;

-- Make paymentFrequency NOT NULL after setting defaults
ALTER TABLE "bookings" 
ALTER COLUMN "paymentFrequency" SET NOT NULL;

-- Add index for payment frequency queries (optional, for performance)
CREATE INDEX IF NOT EXISTS "bookings_paymentFrequency_idx" ON "bookings"("paymentFrequency");

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Payment frequency column added successfully!';
    RAISE NOTICE '📝 Payment frequency options: HOURLY, WEEKLY, MONTHLY, YEARLY';
END $$;

