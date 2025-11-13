# 🔧 FINAL FIX: Supabase Connection

## The Problem
You're getting "Tenant or user not found" or "Can't reach database server" errors because:
1. **Supabase project might be PAUSED** (most common issue)
2. Connection string format is wrong
3. Password is incorrect

## ✅ SOLUTION: Follow These Steps

### Step 1: Check if Supabase Project is Active

**CRITICAL**: Free tier Supabase projects pause after inactivity!

1. Go to: **https://supabase.com/dashboard/project/ptjnlzrvqyynklzdipac**
2. **Look for "Paused" status** or "Restore" button
3. **If paused**: Click "Restore" button
4. **Wait 2-3 minutes** for project to restore
5. **Refresh the page** to confirm it's "Active"

### Step 2: Get the EXACT Connection String

1. Go to: **https://supabase.com/dashboard/project/ptjnlzrvqyynklzdipac/settings/database**
2. Scroll to **"Connection string"** section
3. Click **"URI"** tab
4. You'll see multiple connection strings:
   - **Direct connection** (port 5432) - Use this for Prisma
   - Pooler connection (port 6543) - Don't use for Prisma
5. **Copy the DIRECT connection string** (the one with port 5432)
   - It looks like: `postgresql://postgres:[PASSWORD]@db.ptjnlzrvqyynklzdipac.supabase.co:5432/postgres`
6. **Click "Copy"** button (don't manually type it)

### Step 3: Update .env File

1. Open `.env` file in your project
2. Find the line: `DATABASE_URL="..."`
3. **Replace it** with the connection string you copied
4. **Save the file**

**Example**:
```env
DATABASE_URL="postgresql://postgres.ptjnlzrvqyynklzdipac:[PASSWORD]@db.ptjnlzrvqyynklzdipac.supabase.co:5432/postgres"
```

⚠️ **Important**: 
- Use the connection string **exactly** as shown in Supabase
- Don't modify it
- The password is already included and encoded

### Step 4: Regenerate Prisma Client

```bash
npx prisma generate
```

### Step 5: Push Database Schema

```bash
npx prisma db push
```

### Step 6: Create Admin Account

```bash
npm run setup:admin
```

### Step 7: Test Connection

```bash
npm run test:db
```

You should see: `✅ Connection successful!`

### Step 8: Restart Dev Server

Stop your server (Ctrl+C) and restart:

```bash
npm run dev
```

## Quick Fix Script

If you have the connection string ready:

```bash
npm run fix:supabase
```

This will:
- Test the connection
- Update .env file
- Regenerate Prisma Client

## Why This Happens

1. **Project Paused**: Free tier projects pause after 1 week of inactivity
2. **Wrong Format**: Connection pooling (port 6543) doesn't work well with Prisma
3. **Password Issues**: Password needs to be URL-encoded correctly

## Verification Checklist

After fixing, verify:
- [ ] Supabase project shows "Active" status
- [ ] Connection string copied from Supabase dashboard
- [ ] `.env` file updated with correct connection string
- [ ] `npx prisma generate` completed successfully
- [ ] `npx prisma db push` completed successfully
- [ ] `npm run test:db` shows "Connection successful"
- [ ] Login works in the app

## Still Not Working?

1. **Double-check project is active** in Supabase dashboard
2. **Reset database password** in Supabase:
   - Go to: Settings → Database → Database password
   - Click "Reset database password"
   - Get new connection string
3. **Try direct connection format**:
   ```env
   DATABASE_URL="postgresql://postgres:[PASSWORD]@db.ptjnlzrvqyynklzdipac.supabase.co:5432/postgres"
   ```
4. **Check Supabase logs** in dashboard for errors

## Need Help?

Run the interactive setup:
```bash
npm run setup:backend
```

This will guide you through the entire process step by step.

