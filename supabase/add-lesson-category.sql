-- Add lessonCategory field to bookings table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- Add lessonCategory column to bookings
ALTER TABLE "bookings" 
ADD COLUMN IF NOT EXISTS "lessonCategory" TEXT DEFAULT 'ACADEMIC';

-- Add index for filtering
CREATE INDEX IF NOT EXISTS "bookings_lessonCategory_idx" ON "bookings"("lessonCategory");

-- Add lessonCategory to tutor_profiles to indicate what categories they offer
ALTER TABLE "tutor_profiles"
ADD COLUMN IF NOT EXISTS "lessonCategories" TEXT DEFAULT '["ACADEMIC"]';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Lesson category fields added successfully!';
    RAISE NOTICE '📝 Bookings can now be categorized as ACADEMIC or PROFESSIONAL_TECHNICAL';
    RAISE NOTICE '📝 Tutors can specify which lesson categories they offer';
END $$;

