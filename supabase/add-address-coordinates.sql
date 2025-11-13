-- Add latitude and longitude fields to addresses table for distance calculation
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- Add coordinate fields to addresses
ALTER TABLE "addresses" 
ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;

-- Add index for location-based queries
CREATE INDEX IF NOT EXISTS "addresses_coordinates_idx" ON "addresses"("latitude", "longitude");

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Address coordinate fields added successfully!';
    RAISE NOTICE '📝 Addresses can now store latitude and longitude for precise distance calculation';
END $$;

