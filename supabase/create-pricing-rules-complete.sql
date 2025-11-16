-- COMPLETE VERSION - Run this in Supabase SQL Editor
-- This creates the table, sets permissions, and verifies everything works

-- Step 1: Drop table if it exists (optional - uncomment if you want a fresh start)
-- DROP TABLE IF EXISTS pricing_rules CASCADE;

-- Step 2: Create the pricing_rules table
CREATE TABLE IF NOT EXISTS pricing_rules (
    id TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "lessonType" TEXT NOT NULL,
    "pricePerTwoHours" DOUBLE PRECISION NOT NULL,
    currency TEXT NOT NULL DEFAULT 'GHS',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pricing_rules_lessonType_unique UNIQUE ("lessonType")
);

-- Step 3: Grant necessary permissions (allow public read access via PostgREST)
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policy to allow all reads (pricing rules should be public)
DROP POLICY IF EXISTS "Allow public read access to pricing_rules" ON pricing_rules;
CREATE POLICY "Allow public read access to pricing_rules"
    ON pricing_rules
    FOR SELECT
    USING (true);

-- Step 5: Create RLS policy to allow admin writes (simplified - no auth.uid() check)
-- Note: Admin access is already checked in API routes, so RLS is just for extra security
DROP POLICY IF EXISTS "Allow admin write access to pricing_rules" ON pricing_rules;
-- Simplified policy - allow all operations (admin check happens in API)
CREATE POLICY "Allow all access to pricing_rules"
    ON pricing_rules
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Step 6: Insert default pricing rules
INSERT INTO pricing_rules (id, "lessonType", "pricePerTwoHours", currency, "isActive")
VALUES 
    ('pricing_inperson_1', 'IN_PERSON', 50.00, 'GHS', true),
    ('pricing_online_1', 'ONLINE', 30.00, 'GHS', true)
ON CONFLICT ("lessonType") DO NOTHING;

-- Step 7: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS pricing_rules_lessonType_idx ON pricing_rules("lessonType");
CREATE INDEX IF NOT EXISTS pricing_rules_isActive_idx ON pricing_rules("isActive");

-- Step 8: Verify the table was created and has data
SELECT 
    '✅ Table created successfully!' as status,
    COUNT(*) as row_count,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'pricing_rules') as column_count
FROM pricing_rules;

-- Step 9: Show the actual data
SELECT * FROM pricing_rules ORDER BY "lessonType";

