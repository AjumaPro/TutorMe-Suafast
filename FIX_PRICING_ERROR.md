# 🔧 FIX: "Pricing Rules Table Not Found" Error

## ⚠️ The Problem
The error message you're seeing means the `pricing_rules` table **doesn't exist** in your Supabase database yet.

## ✅ THE SOLUTION (3 Steps)

### Step 1: Open Supabase SQL Editor
1. Go to: **https://supabase.com/dashboard**
2. Click on **your project**
3. In the left sidebar, click **"SQL Editor"**
4. Click **"New query"** button (top right)

### Step 2: Copy & Paste This SQL

Copy **ALL** of this SQL code:

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

INSERT INTO pricing_rules (id, "lessonType", "pricePerTwoHours", currency, "isActive")
VALUES 
    ('pricing_inperson_1', 'IN_PERSON', 50.00, 'GHS', true),
    ('pricing_online_1', 'ONLINE', 30.00, 'GHS', true)
ON CONFLICT ("lessonType") DO NOTHING;

CREATE INDEX IF NOT EXISTS pricing_rules_lessonType_idx ON pricing_rules("lessonType");
CREATE INDEX IF NOT EXISTS pricing_rules_isActive_idx ON pricing_rules("isActive");

SELECT '✅ SUCCESS! Table created with' as message, COUNT(*) as rows FROM pricing_rules;
```

### Step 3: Run It
1. **Paste** the SQL into Supabase SQL Editor
2. Click the **"Run"** button (or press `Cmd+Enter` / `Ctrl+Enter`)
3. You should see: `✅ SUCCESS! Table created with rows: 2`
4. **Wait 10-30 seconds**
5. **Refresh** your `/admin?tab=pricing` page
6. **The error should be gone!** ✅

## 🔍 Verify It Worked

After running the SQL, verify in Supabase:

1. Go to **"Table Editor"** in Supabase
2. Look for **`pricing_rules`** table
3. You should see 2 rows:
   - `IN_PERSON` → `50.00`
   - `ONLINE` → `30.00`

## 🆘 Still Not Working?

### Option 1: Refresh Schema Cache
1. Supabase Dashboard → **Settings** → **API**
2. Click **"Reload Schema Cache"** button
3. Wait 10 seconds
4. Refresh your admin page

### Option 2: Check if Table Exists
Run this in Supabase SQL Editor:
```sql
SELECT * FROM pricing_rules;
```

If you see 2 rows, the table exists! The issue might be schema cache.

### Option 3: Check for Errors
- Look at the Supabase SQL Editor output
- If there are any red error messages, copy them
- The SQL above should work without errors

## 📝 Files Available

I've created these SQL files for you:
- `supabase/create-pricing-rules-no-rls.sql` - **Use this one** (simplest)
- `supabase/create-pricing-rules-fixed.sql` - Alternative version
- `supabase/create-pricing-rules-simple.sql` - Another option

**All of them do the same thing** - pick any one and run it!

## ✅ After Running SQL

Once you run the SQL successfully:
1. ✅ Table will be created
2. ✅ Default prices will be inserted (IN_PERSON: ₵50, ONLINE: ₵30)
3. ✅ Error will disappear
4. ✅ You can edit prices in the admin panel

---

**Remember:** The error will keep showing until you actually run the SQL in Supabase! The code is correct, but the database table needs to be created first.

