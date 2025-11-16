-- Verify pricing_rules table exists and fix if needed
-- Run this in Supabase SQL Editor

-- Step 1: Check if table exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'pricing_rules'
        ) THEN '✅ Table EXISTS'
        ELSE '❌ Table DOES NOT EXIST'
    END as table_status;

-- Step 2: Show table structure if it exists
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'pricing_rules'
ORDER BY ordinal_position;

-- Step 3: Show data if table exists
SELECT * FROM pricing_rules;

-- Step 4: If table doesn't exist, create it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'pricing_rules'
    ) THEN
        -- Create the table
        CREATE TABLE pricing_rules (
            id TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
            "lessonType" TEXT NOT NULL,
            "pricePerTwoHours" DOUBLE PRECISION NOT NULL,
            currency TEXT NOT NULL DEFAULT 'GHS',
            "isActive" BOOLEAN NOT NULL DEFAULT true,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT pricing_rules_lessonType_unique UNIQUE ("lessonType")
        );

        ALTER TABLE pricing_rules DISABLE ROW LEVEL SECURITY;

        INSERT INTO pricing_rules (id, "lessonType", "pricePerTwoHours", currency, "isActive")
        VALUES 
            ('pricing_inperson_1', 'IN_PERSON', 50.00, 'GHS', true),
            ('pricing_online_1', 'ONLINE', 30.00, 'GHS', true)
        ON CONFLICT ("lessonType") DO NOTHING;

        CREATE INDEX IF NOT EXISTS pricing_rules_lessonType_idx ON pricing_rules("lessonType");
        CREATE INDEX IF NOT EXISTS pricing_rules_isActive_idx ON pricing_rules("isActive");

        RAISE NOTICE '✅ Table created successfully!';
    ELSE
        RAISE NOTICE '✅ Table already exists!';
    END IF;
END $$;

-- Step 5: Final verification
SELECT 
    'Final Check:' as status,
    COUNT(*) as row_count,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'pricing_rules') as column_count
FROM pricing_rules;

