-- Add currency support to existing tables
-- Run this in Supabase SQL Editor after the main schema is created

-- Add currency column to tutor_profiles (default: GHS)
ALTER TABLE "tutor_profiles" 
ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'GHS';

-- Add currency column to bookings (default: GHS)
ALTER TABLE "bookings" 
ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'GHS';

-- Add currency column to payments (default: GHS)
ALTER TABLE "payments" 
ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'GHS';

-- Add index for currency queries (optional, for performance)
CREATE INDEX IF NOT EXISTS "tutor_profiles_currency_idx" ON "tutor_profiles"("currency");
CREATE INDEX IF NOT EXISTS "bookings_currency_idx" ON "bookings"("currency");
CREATE INDEX IF NOT EXISTS "payments_currency_idx" ON "payments"("currency");

-- Update existing records to use GHS if currency is NULL (safety check)
UPDATE "tutor_profiles" SET "currency" = 'GHS' WHERE "currency" IS NULL;
UPDATE "bookings" SET "currency" = 'GHS' WHERE "currency" IS NULL;
UPDATE "payments" SET "currency" = 'GHS' WHERE "currency" IS NULL;

