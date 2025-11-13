# 🔍 Verify Supabase Connection

## Issue Found
DNS resolution is failing for `db.ptjnlzrvqyynklzdipac.supabase.co`

This means either:
1. The project reference ID is incorrect
2. The hostname format is wrong
3. The project might be in a different region

## ✅ Solution: Verify Project Details

### Step 1: Verify Project Reference ID

1. Go to: **https://supabase.com/dashboard/project/ptjnlzrvqyynklzdipac**
2. Check the **URL** - the project reference should match `ptjnlzrvqyynklzdipac`
3. If it's different, note the correct project reference

### Step 2: Get Exact Connection String

1. Go to: **https://supabase.com/dashboard/project/ptjnlzrvqyynklzdipac/settings/database**
2. Scroll to **"Connection string"** section
3. Click **"URI"** tab
4. **Copy the ENTIRE connection string** (click "Copy" button)
   - Don't type it manually
   - Don't modify it
   - Use it exactly as shown

### Step 3: Check Connection String Format

The connection string should look like one of these:

**Option 1 - Direct Connection:**
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

**Option 2 - Pooler Connection:**
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

**Option 3 - Different Region:**
```
postgresql://postgres:[PASSWORD]@[DIFFERENT-HOSTNAME]:5432/postgres
```

### Step 4: Update .env

1. Open `.env` file
2. Replace `DATABASE_URL` with the exact connection string from Supabase
3. Save the file

### Step 5: Test Connection

```bash
npm run test:db
```

## Common Issues

### Issue 1: Wrong Project Reference

If the project reference in the URL doesn't match `ptjnlzrvqyynklzdipac`:
- Use the correct project reference from your Supabase dashboard URL
- Update all scripts and connection strings

### Issue 2: Different Hostname Format

Supabase might use a different hostname format:
- Check the connection string from Supabase dashboard
- It might not be `db.[PROJECT-REF].supabase.co`
- Could be region-specific like `aws-0-[REGION].pooler.supabase.com`

### Issue 3: IP Restrictions

1. Go to: **Settings → Database → Network restrictions**
2. Check if your IP is whitelisted
3. If restricted, add your IP or allow all IPs (for development)

## Quick Fix

Run this and paste the EXACT connection string from Supabase:

```bash
npm run get:connection
```

Then follow the prompts and paste the connection string when asked.

## Still Not Working?

1. **Double-check project is active** in dashboard
2. **Verify project reference ID** matches the one in your URL
3. **Get connection string directly from Supabase** (don't construct it)
4. **Check Supabase status**: https://status.supabase.com/
5. **Try resetting database password** and get new connection string

