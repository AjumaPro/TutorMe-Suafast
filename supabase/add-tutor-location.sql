-- Add location fields to tutor_profiles table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- Add location fields to tutor_profiles
ALTER TABLE "tutor_profiles" 
ADD COLUMN IF NOT EXISTS "address" TEXT,
ADD COLUMN IF NOT EXISTS "city" TEXT,
ADD COLUMN IF NOT EXISTS "state" TEXT,
ADD COLUMN IF NOT EXISTS "zipCode" TEXT,
ADD COLUMN IF NOT EXISTS "country" TEXT DEFAULT 'USA',
ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;

-- Add index for location-based queries
CREATE INDEX IF NOT EXISTS "tutor_profiles_location_idx" ON "tutor_profiles"("city", "state");
CREATE INDEX IF NOT EXISTS "tutor_profiles_coordinates_idx" ON "tutor_profiles"("latitude", "longitude");

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Tutor location fields added successfully!';
    RAISE NOTICE '📝 Tutors can now add their location during registration';
    RAISE NOTICE '📍 Location fields: address, city, state, zipCode, country, latitude, longitude';
END $$;

