-- SIMPLE VERSION - Copy and paste this entire file into Supabase SQL Editor
-- This creates the pricing_rules table with proper column names matching the code

-- Step 1: Create the table (all columns use quoted names to preserve camelCase)
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

-- Step 2: Insert default data
INSERT INTO pricing_rules (id, "lessonType", "pricePerTwoHours", currency, "isActive")
VALUES 
    ('pricing_inperson_1', 'IN_PERSON', 50.00, 'GHS', true),
    ('pricing_online_1', 'ONLINE', 30.00, 'GHS', true)
ON CONFLICT ("lessonType") DO NOTHING;

-- Step 3: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS pricing_rules_lessonType_idx ON pricing_rules("lessonType");
CREATE INDEX IF NOT EXISTS pricing_rules_isActive_idx ON pricing_rules("isActive");

-- Step 4: Verify the table was created (this should return 2 rows)
SELECT * FROM pricing_rules;

-- If you see 2 rows above, the table was created successfully!
-- Now wait 10-30 seconds and refresh your admin pricing page.

