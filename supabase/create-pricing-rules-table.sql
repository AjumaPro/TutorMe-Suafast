-- Create pricing_rules table for admin pricing configuration
-- Run this in Supabase SQL Editor

-- Create the table
CREATE TABLE IF NOT EXISTS "pricing_rules" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "lessonType" TEXT NOT NULL UNIQUE,
    "pricePerTwoHours" DOUBLE PRECISION NOT NULL,
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "pricing_rules_lessonType_idx" ON "pricing_rules"("lessonType");
CREATE INDEX IF NOT EXISTS "pricing_rules_isActive_idx" ON "pricing_rules"("isActive");

-- Verify the table was created
SELECT '✅ pricing_rules table created successfully!' as status;

