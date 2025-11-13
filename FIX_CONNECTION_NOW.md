# 🔧 Fix Database Connection - Step by Step

## Current Error
```
Can't reach database server at `db.ptjnlzrvqyynklzdipac.supabase.co:5432`
```

## Quick Fix (5 minutes)

### Step 1: Check Supabase Project Status

1. **Go to**: https://supabase.com/dashboard/project/ptjnlzrvqyynklzdipac
2. **Check if project is ACTIVE**:
   - If you see "Paused" or "Restore" button → Click "Restore"
   - Wait 2-3 minutes for project to restore
   - Project must be ACTIVE for connection to work

### Step 2: Get Connection String from Supabase

1. **Go to**: https://supabase.com/dashboard/project/ptjnlzrvqyynklzdipac/settings/database
2. **Scroll down** to "Connection string" section
3. **Click "URI" tab**
4. **Click "Copy" button** (this copies the ENTIRE connection string)
   - ⚠️ **Important**: Copy the entire string, don't modify it
   - The connection string includes the password and is already formatted correctly

### Step 3: Update .env File

1. Open `.env` file in your project
2. Find the line: `DATABASE_URL="..."`
3. Replace it with the connection string you copied from Supabase
4. Save the file

**Example format** (yours will be different):
```env
DATABASE_URL="postgresql://postgres.ptjnlzrvqyynklzdipac:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"
```

### Step 4: Test Connection

```bash
npm run test:db
```

If successful, you'll see: `✅ Connection successful!`

### Step 5: Generate Prisma Client

```bash
npx prisma generate
```

### Step 6: Push Database Schema

```bash
npx prisma db push
```

### Step 7: Create Admin Account

```bash
npm run setup:admin
```

### Step 8: Restart Dev Server

Stop your server (Ctrl+C) and restart:
```bash
npm run dev
```

## After Fixing

✅ Login will work
✅ You can create accounts
✅ All database operations will work

## Still Not Working?

1. **Verify project is active** in Supabase dashboard
2. **Double-check connection string** matches Supabase dashboard exactly
3. **Try resetting database password** in Supabase dashboard
4. **Check Supabase logs** in dashboard for any errors

## Quick Commands

```bash
# Test connection
npm run test:db

# Interactive fix
npm run fix:login

# Generate Prisma Client
npx prisma generate

# Push schema
npx prisma db push

# Create admin
npm run setup:admin
```

