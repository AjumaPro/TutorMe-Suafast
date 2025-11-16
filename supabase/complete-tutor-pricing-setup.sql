-- Complete Tutor Pricing Setup
-- This script creates tutor_profiles table (if needed) and adds all pricing fields
-- Run this in Supabase SQL Editor

-- ============================================================================
-- STEP 1: Create tutor_profiles table (if it doesn't exist)
-- ============================================================================
DO $$
DECLARE
    users_id_type TEXT;
    table_exists BOOLEAN;
BEGIN
    -- Check if tutor_profiles table already exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tutor_profiles'
    ) INTO table_exists;

    -- Only create table if it doesn't exist
    IF NOT table_exists THEN
        -- Get the data type of users.id column
        SELECT data_type INTO users_id_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'id';

        -- If users table doesn't exist, create it with TEXT (default)
        IF users_id_type IS NULL THEN
            CREATE TABLE IF NOT EXISTS users (
                id TEXT NOT NULL PRIMARY KEY,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                name TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'PARENT',
                phone TEXT,
                image TEXT,
                "emailVerified" TIMESTAMP(3),
                "resetToken" TEXT,
                "resetTokenExpiry" TIMESTAMP(3),
                "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
                "accountLockedUntil" TIMESTAMP(3),
                "lastLoginAt" TIMESTAMP(3),
                "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
                "twoFactorMethod" TEXT,
                "totpSecret" TEXT,
                "backupCodes" TEXT,
                "emailOtpCode" TEXT,
                "emailOtpExpiry" TIMESTAMP(3),
                "smsOtpCode" TEXT,
                "smsOtpExpiry" TIMESTAMP(3),
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL
            );
            users_id_type := 'text';
        END IF;

        -- Create tutor_profiles table with matching type
        IF users_id_type = 'uuid' THEN
            -- Users table uses UUID, so use UUID for userId
            CREATE TABLE tutor_profiles (
                id TEXT NOT NULL PRIMARY KEY,
                "userId" UUID NOT NULL UNIQUE,
                bio TEXT,
                subjects TEXT NOT NULL DEFAULT '[]',
                grades TEXT NOT NULL DEFAULT '[]',
                "hourlyRate" DOUBLE PRECISION NOT NULL,
                currency TEXT NOT NULL DEFAULT 'GHS',
                availability TEXT,
                experience INTEGER,
                "isVerified" BOOLEAN NOT NULL DEFAULT false,
                "isApproved" BOOLEAN NOT NULL DEFAULT false,
                credentials TEXT,
                rating DOUBLE PRECISION NOT NULL DEFAULT 0,
                "totalReviews" INTEGER NOT NULL DEFAULT 0,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL,
                CONSTRAINT "tutor_profiles_userId_fkey" 
                    FOREIGN KEY ("userId") REFERENCES users(id) 
                    ON DELETE CASCADE ON UPDATE CASCADE
            );
        ELSE
            -- Users table uses TEXT, so use TEXT for userId
            CREATE TABLE tutor_profiles (
                id TEXT NOT NULL PRIMARY KEY,
                "userId" TEXT NOT NULL UNIQUE,
                bio TEXT,
                subjects TEXT NOT NULL DEFAULT '[]',
                grades TEXT NOT NULL DEFAULT '[]',
                "hourlyRate" DOUBLE PRECISION NOT NULL,
                currency TEXT NOT NULL DEFAULT 'GHS',
                availability TEXT,
                experience INTEGER,
                "isVerified" BOOLEAN NOT NULL DEFAULT false,
                "isApproved" BOOLEAN NOT NULL DEFAULT false,
                credentials TEXT,
                rating DOUBLE PRECISION NOT NULL DEFAULT 0,
                "totalReviews" INTEGER NOT NULL DEFAULT 0,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL,
                CONSTRAINT "tutor_profiles_userId_fkey" 
                    FOREIGN KEY ("userId") REFERENCES users(id) 
                    ON DELETE CASCADE ON UPDATE CASCADE
            );
        END IF;

        RAISE NOTICE '✅ tutor_profiles table created successfully!';
        RAISE NOTICE '📝 Users.id type detected: %', users_id_type;
    ELSE
        RAISE NOTICE 'ℹ️  tutor_profiles table already exists, skipping creation';
    END IF;
END $$;

-- ============================================================================
-- STEP 2: Add pricing fields to tutor_profiles table
-- ============================================================================
ALTER TABLE tutor_profiles 
ADD COLUMN IF NOT EXISTS "academicInPersonPricePerTwoHours" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "academicOnlinePricePerTwoHours" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "professionalPricePerHour" DOUBLE PRECISION;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS "tutor_profiles_pricing_idx" 
ON tutor_profiles("academicInPersonPricePerTwoHours", "academicOnlinePricePerTwoHours", "professionalPricePerHour");

-- ============================================================================
-- STEP 3: Create pricing_rules table (admin pricing defaults)
-- ============================================================================
CREATE TABLE IF NOT EXISTS "pricing_rules" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "lessonType" TEXT NOT NULL, -- 'IN_PERSON' or 'ONLINE'
    "pricePerTwoHours" DOUBLE PRECISION NOT NULL, -- Price per 2 hours
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pricing_rules_lessonType_unique" UNIQUE ("lessonType")
);

-- Insert default pricing rules (if they don't exist)
INSERT INTO "pricing_rules" ("id", "lessonType", "pricePerTwoHours", "currency", "isActive")
VALUES 
    ('pricing_inperson_1', 'IN_PERSON', 50.00, 'GHS', true),
    ('pricing_online_1', 'ONLINE', 30.00, 'GHS', true)
ON CONFLICT ("lessonType") DO UPDATE SET
    "pricePerTwoHours" = EXCLUDED."pricePerTwoHours",
    "updatedAt" = CURRENT_TIMESTAMP;

-- Create indexes for pricing_rules
CREATE INDEX IF NOT EXISTS "pricing_rules_lessonType_idx" ON "pricing_rules"("lessonType");
CREATE INDEX IF NOT EXISTS "pricing_rules_isActive_idx" ON "pricing_rules"("isActive");

-- ============================================================================
-- Success Message
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ ==========================================';
    RAISE NOTICE '✅ Tutor Pricing Setup Complete!';
    RAISE NOTICE '✅ ==========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Created/Updated:';
    RAISE NOTICE '   ✅ tutor_profiles table';
    RAISE NOTICE '   ✅ Added pricing fields:';
    RAISE NOTICE '      - academicInPersonPricePerTwoHours';
    RAISE NOTICE '      - academicOnlinePricePerTwoHours';
    RAISE NOTICE '      - professionalPricePerHour';
    RAISE NOTICE '   ✅ pricing_rules table';
    RAISE NOTICE '   ✅ Default pricing rules (IN_PERSON: ₵50, ONLINE: ₵30)';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Next Steps:';
    RAISE NOTICE '   1. Admins can set pricing at /admin?tab=pricing';
    RAISE NOTICE '   2. Tutors can set their prices at /tutor/pricing';
    RAISE NOTICE '';
END $$;

