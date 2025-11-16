# 🔧 How to Fix "Pricing Rules Table Not Found" Error

## The Problem
The error `PGRST205` means the `pricing_rules` table doesn't exist in your Supabase database yet.

## ✅ Solution: Run SQL in Supabase

### Step 1: Open Supabase Dashboard
1. Go to: **https://supabase.com/dashboard**
2. **Select your project** (click on it)
3. In the left sidebar, click **"SQL Editor"**

### Step 2: Create New Query
1. Click **"New query"** button (top right)
2. You'll see a blank SQL editor

### Step 3: Copy SQL Code
Open one of these files in your project:
- **`supabase/create-pricing-rules-simple.sql`** (recommended - simplest)
- OR `supabase/create-pricing-rules-table.sql`

**Copy ALL the SQL code** from the file.

### Step 4: Paste and Run
1. **Paste** the SQL code into the Supabase SQL Editor
2. Click the **"Run"** button (or press `Cmd+Enter` / `Ctrl+Enter`)
3. Wait for the success message at the bottom

### Step 5: Verify Table Was Created
Run this query in SQL Editor:
```sql
SELECT * FROM pricing_rules;
```

You should see 2 rows:
- `IN_PERSON` with price `50.00`
- `ONLINE` with price `30.00`

### Step 6: Refresh Schema Cache (if needed)
If the error persists after 30 seconds:
1. Go to **Settings** → **API**
2. Click **"Reload Schema Cache"** button
3. Wait 10 seconds
4. Refresh your admin page

### Step 7: Test
1. Go to `/admin?tab=pricing` in your app
2. The error should be gone!
3. You should see the pricing rules form

## 🆘 Still Not Working?

### Check 1: Did the SQL run successfully?
- Look for any error messages in Supabase SQL Editor
- If you see errors, copy them and check the syntax

### Check 2: Is the table actually created?
Run this in Supabase SQL Editor:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'pricing_rules';
```

If this returns no rows, the table wasn't created. Try running the SQL again.

### Check 3: Check table structure
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'pricing_rules';
```

This should show all columns of the table.

## 📝 Quick Copy-Paste SQL

If you want the simplest version, use this:

```sql
CREATE TABLE IF NOT EXISTS pricing_rules (
    id TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "lessonType" TEXT NOT NULL UNIQUE,
    "pricePerTwoHours" DOUBLE PRECISION NOT NULL,
    currency TEXT NOT NULL DEFAULT 'GHS',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO pricing_rules (id, "lessonType", "pricePerTwoHours", currency, "isActive")
VALUES 
    ('pricing_inperson_1', 'IN_PERSON', 50.00, 'GHS', true),
    ('pricing_online_1', 'ONLINE', 30.00, 'GHS', true)
ON CONFLICT ("lessonType") DO NOTHING;

CREATE INDEX IF NOT EXISTS pricing_rules_lessonType_idx ON pricing_rules("lessonType");
CREATE INDEX IF NOT EXISTS pricing_rules_isActive_idx ON pricing_rules("isActive");
```

Copy the above SQL, paste into Supabase SQL Editor, and click Run!
