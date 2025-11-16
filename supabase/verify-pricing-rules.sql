-- Verify pricing_rules table exists
-- Run this in Supabase SQL Editor to check if the table was created

-- Check if table exists
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'pricing_rules'
ORDER BY ordinal_position;

-- Check current data
SELECT * FROM "pricing_rules";

-- If table doesn't exist, you'll see no results
-- If table exists, you'll see the columns and data

