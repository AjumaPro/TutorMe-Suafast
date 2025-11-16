-- SIMPLE VERSION WITHOUT RLS - Use this to avoid UUID/TEXT type errors
-- Copy ALL of this into Supabase SQL Editor and click RUN

-- Drop table if exists (optional - uncomment if you want fresh start)
-- DROP TABLE IF EXISTS pricing_rules CASCADE;

-- Create the pricing_rules table
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

-- Disable RLS for this table completely (avoids UUID/TEXT type mismatch errors)
ALTER TABLE pricing_rules DISABLE ROW LEVEL SECURITY;

-- Drop any existing RLS policies (in case they exist)
DROP POLICY IF EXISTS "Allow public read access to pricing_rules" ON pricing_rules;
DROP POLICY IF EXISTS "Allow admin write access to pricing_rules" ON pricing_rules;
DROP POLICY IF EXISTS "Allow all access to pricing_rules" ON pricing_rules;

-- Insert default pricing rules
INSERT INTO pricing_rules (id, "lessonType", "pricePerTwoHours", currency, "isActive")
VALUES 
    ('pricing_inperson_1', 'IN_PERSON', 50.00, 'GHS', true),
    ('pricing_online_1', 'ONLINE', 30.00, 'GHS', true)
ON CONFLICT ("lessonType") DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS pricing_rules_lessonType_idx ON pricing_rules("lessonType");
CREATE INDEX IF NOT EXISTS pricing_rules_isActive_idx ON pricing_rules("isActive");

-- Verify creation
SELECT 
    '✅ Table created!' as status,
    COUNT(*) as row_count
FROM pricing_rules;

-- Show the data
SELECT * FROM pricing_rules;

