# 🔧 Fix Supabase Connection Error

## Current Error
```
Can't reach database server at `db.ptjnlzrvqyynklzdipac.supabase.co:5432`
```

## Quick Fix (Recommended)

Run this command and follow the prompts:

```bash
npm run setup:supabase:get
```

This will:
1. Guide you to get the connection string from Supabase dashboard
2. Test the connection
3. Update your `.env` file
4. Generate Prisma Client
5. Push database schema

## Manual Fix Steps

### Step 1: Check Supabase Project Status

1. Go to: https://supabase.com/dashboard/project/ptjnlzrvqyynklzdipac
2. **Check if project is ACTIVE** (not paused)
   - If you see "Paused" or "Restore" button, click it
   - Wait 2-3 minutes for project to restore

### Step 2: Get Connection String from Supabase

1. Go to: https://supabase.com/dashboard/project/ptjnlzrvqyynklzdipac/settings/database
2. Scroll to **"Connection string"** section
3. Click on **"URI"** tab
4. You'll see a connection string like:
   ```
   postgresql://postgres.ptjnlzrvqyynklzdipac:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```
5. **Click the "Copy" button** to copy the entire connection string
   - ⚠️ **Important**: Copy the ENTIRE string (it includes the password)
   - Don't manually construct it

### Step 3: Update .env File

Open your `.env` file and replace the `DATABASE_URL` line with the connection string you copied:

```env
DATABASE_URL="postgresql://postgres.ptjnlzrvqyynklzdipac:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
```

**Important**: 
- Use the connection string directly from Supabase (don't modify it)
- The password is already URL-encoded in the connection string

### Step 4: Generate Prisma Client

```bash
npx prisma generate
```

### Step 5: Push Database Schema

```bash
npx prisma db push
```

### Step 6: Test Connection

```bash
npm run test:db
```

### Step 7: Create Admin Account

```bash
npm run setup:admin
```

### Step 8: Restart Dev Server

Stop your current dev server (Ctrl+C) and restart:

```bash
npm run dev
```

## Common Issues

### Issue 1: "Can't reach database server"

**Causes:**
- Supabase project is paused
- Wrong connection string format
- Network/firewall blocking

**Solutions:**
1. Check project status in Supabase dashboard
2. Use connection string directly from Supabase (don't construct manually)
3. Make sure project is active (not paused)

### Issue 2: "Password authentication failed"

**Causes:**
- Wrong password
- Password not properly encoded

**Solutions:**
1. Use connection string directly from Supabase (password is pre-encoded)
2. Or reset password in Supabase dashboard and get new connection string

### Issue 3: Connection works but app still shows errors

**Causes:**
- Prisma Client not regenerated
- Server needs restart

**Solutions:**
```bash
npx prisma generate
# Then restart dev server
```

## Verification

After fixing, verify everything works:

1. ✅ Connection test passes: `npm run test:db`
2. ✅ Can login to app
3. ✅ Database queries work
4. ✅ No connection errors in terminal

## Need Help?

1. Run: `npm run setup:supabase:get` (interactive setup)
2. Check Supabase dashboard for project status
3. Verify connection string format matches Supabase dashboard exactly

