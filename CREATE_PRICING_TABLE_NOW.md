# 🚀 CREATE PRICING RULES TABLE - Step by Step

## ⚠️ The Error Means:
The `pricing_rules` table doesn't exist in your Supabase database yet.

## ✅ SOLUTION: Run SQL in Supabase (5 Minutes)

### Step 1: Open Supabase Dashboard
1. Go to: **https://supabase.com/dashboard**
2. **Click on your project** (select it)
3. In the **left sidebar**, click **"SQL Editor"**
4. Click **"New query"** button (top right corner)

### Step 2: Copy the SQL
Open this file in your project:
- **`supabase/create-pricing-rules-no-rls.sql`**

**Copy ALL the SQL code** from that file.

### Step 3: Paste and Run
1. **Paste** the SQL into the Supabase SQL Editor
2. Click the **"Run"** button (or press `Cmd+Enter` / `Ctrl+Enter`)
3. **Wait for the success message**

You should see:
```
✅ Table created! | row_count: 2
```

### Step 4: Verify It Worked
In Supabase SQL Editor, run this query:
```sql
SELECT * FROM pricing_rules;
```

You should see 2 rows:
- `IN_PERSON` → `50.00`
- `ONLINE` → `30.00`

### Step 5: Refresh Your App
1. **Wait 10-30 seconds** (for schema cache to refresh)
2. Go to: **`/admin?tab=pricing`** in your app
3. **Refresh the page**
4. ✅ **The error should be gone!**

## 📋 Quick Copy-Paste SQL

If you want to copy directly, here's the SQL:

```sql
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

ALTER TABLE pricing_rules DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to pricing_rules" ON pricing_rules;
DROP POLICY IF EXISTS "Allow admin write access to pricing_rules" ON pricing_rules;
DROP POLICY IF EXISTS "Allow all access to pricing_rules" ON pricing_rules;

INSERT INTO pricing_rules (id, "lessonType", "pricePerTwoHours", currency, "isActive")
VALUES 
    ('pricing_inperson_1', 'IN_PERSON', 50.00, 'GHS', true),
    ('pricing_online_1', 'ONLINE', 30.00, 'GHS', true)
ON CONFLICT ("lessonType") DO NOTHING;

CREATE INDEX IF NOT EXISTS pricing_rules_lessonType_idx ON pricing_rules("lessonType");
CREATE INDEX IF NOT EXISTS pricing_rules_isActive_idx ON pricing_rules("isActive");

SELECT '✅ SUCCESS! Table created with' as message, COUNT(*) as rows FROM pricing_rules;
```

## 🆘 Troubleshooting

### If you get an error:
1. **Check the error message** in Supabase SQL Editor
2. Make sure you copied **ALL** the SQL
3. Try running it again

### If table still not found after 30 seconds:
1. Supabase Dashboard → **Settings** → **API**
2. Click **"Reload Schema Cache"** button
3. Wait 10 seconds
4. Refresh your admin page

### Verify table exists:
Run this in Supabase SQL Editor:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'pricing_rules';
```

If you see `pricing_rules` in the results, the table exists!

## ✅ After Success

Once the table is created:
- ✅ Error will disappear
- ✅ You can edit pricing in admin panel
- ✅ Default prices: IN_PERSON ₵50, ONLINE ₵30

---

**Remember:** You MUST run the SQL in Supabase SQL Editor. The code can't create the table automatically - it needs to be created in your database first!

