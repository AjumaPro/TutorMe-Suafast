# 🔧 Fix PGRST205 Error - Schema Cache Issue

## ⚠️ The Error
```
PGRST205: Could not find the table 'public.pricing_rules' in the schema cache
```

This means the table **EXISTS** in your database, but PostgREST (Supabase's API layer) hasn't refreshed its cache yet.

## ✅ SOLUTION: Reload Schema Cache

### Method 1: Via Supabase Dashboard (RECOMMENDED)

1. **Go to Supabase Dashboard**
   - https://supabase.com/dashboard
   - Select your project

2. **Navigate to Settings**
   - Click the **gear icon** (⚙️) in the bottom left
   - OR go to: **Settings** → **API**

3. **Reload Schema Cache**
   - Scroll down to find **"Schema Cache"** section
   - Click the **"Reload Schema Cache"** button
   - Wait 20-30 seconds

4. **Refresh Your App**
   - Go to `/admin?tab=pricing`
   - Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
   - Error should be gone! ✅

### Method 2: Via SQL (Alternative)

If you can't find the "Reload Schema Cache" button, you can try:

```sql
-- This forces PostgREST to refresh by querying the table
SELECT * FROM pricing_rules LIMIT 1;
```

Then wait 30-60 seconds and refresh your app.

### Method 3: Restart Everything

If Methods 1 & 2 don't work:

1. **Stop Next.js Server**
   ```bash
   # Press Ctrl+C in terminal
   ```

2. **Restart Next.js**
   ```bash
   npm run dev
   ```

3. **Clear Browser Cache**
   - Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
   - OR clear browser cache completely

4. **Try Again**
   - Go to `/admin?tab=pricing`
   - Should work now! ✅

## 🔍 Verify Table Exists

Before reloading cache, verify the table actually exists:

**In Supabase SQL Editor, run:**
```sql
SELECT * FROM pricing_rules;
```

**Expected Result:**
- ✅ If you see 2 rows → Table EXISTS! Just need to reload cache
- ❌ If you get an error → Table doesn't exist, run the SQL creation script again

## 📋 Quick Checklist

- [ ] Verified table exists with `SELECT * FROM pricing_rules;`
- [ ] Went to Supabase Dashboard → Settings → API
- [ ] Clicked "Reload Schema Cache" button
- [ ] Waited 20-30 seconds
- [ ] Refreshed `/admin?tab=pricing` page
- [ ] Error should be gone! ✅

## 🆘 Still Not Working?

If you've done all the above and it still doesn't work:

1. **Check Supabase Project**
   - Make sure you're in the correct Supabase project
   - Verify your `.env.local` has the correct `NEXT_PUBLIC_SUPABASE_URL`

2. **Check Table Name**
   - In Supabase Table Editor, look for `pricing_rules`
   - Make sure it's in the `public` schema

3. **Try Creating Table Again**
   - Run `supabase/create-pricing-rules-no-rls.sql` again
   - Then reload schema cache

4. **Contact Support**
   - If nothing works, there might be a Supabase project issue
   - Check Supabase status page

## 💡 Why This Happens

PostgREST (Supabase's API layer) caches the database schema for performance. When you create a new table:
- ✅ Table is created in PostgreSQL immediately
- ⏰ PostgREST cache refreshes automatically (usually 1-2 minutes)
- 🔄 OR you can force refresh by clicking "Reload Schema Cache"

The table **definitely exists** - PostgREST just needs to know about it!

