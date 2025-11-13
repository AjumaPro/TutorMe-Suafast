-- Add isActive column to tutor_profiles table
-- Run this in Supabase SQL Editor

-- Add isActive column (default: true for existing tutors)
ALTER TABLE "tutor_profiles" 
ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;

-- Set all existing tutors to active
UPDATE "tutor_profiles" SET "isActive" = true WHERE "isActive" IS NULL;

-- Make the column NOT NULL
ALTER TABLE "tutor_profiles" 
ALTER COLUMN "isActive" SET NOT NULL;

-- Set default value for future inserts
ALTER TABLE "tutor_profiles" 
ALTER COLUMN "isActive" SET DEFAULT true;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS "tutor_profiles_isActive_idx" ON "tutor_profiles"("isActive");

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ isActive column added to tutor_profiles successfully!';
END $$;

