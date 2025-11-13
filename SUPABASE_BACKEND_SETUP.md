# 🚀 Supabase Backend Setup Guide

## Quick Setup

Run the interactive setup script:

```bash
npm run setup:backend
```

This will guide you through:
1. Getting the connection string from Supabase
2. Testing the connection
3. Updating your `.env` file
4. Generating Prisma Client
5. Pushing database schema
6. Creating admin account

## Manual Setup Steps

### Step 1: Check Supabase Project Status

1. Go to: https://supabase.com/dashboard/project/ptjnlzrvqyynklzdipac
2. **Check if project is ACTIVE** (not paused)
   - If you see "Paused" or "Restore" button → Click "Restore"
   - Wait 2-3 minutes for project to restore

### Step 2: Get Database Connection String

1. Go to: https://supabase.com/dashboard/project/ptjnlzrvqyynklzdipac/settings/database
2. Scroll to **"Connection string"** section
3. Click **"URI"** tab
4. Click **"Copy"** button (copies entire connection string)
   - ⚠️ **Important**: Copy the entire string, don't modify it

### Step 3: Get Supabase API Credentials (Optional)

For Supabase features like Storage and Realtime:

1. Go to: https://supabase.com/dashboard/project/ptjnlzrvqyynklzdipac/settings/api
2. Copy **"Project URL"**
3. Copy **"anon public"** key

### Step 4: Update .env File

Add/update these variables in your `.env` file:

```env
# Database Connection (REQUIRED)
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"

# Supabase API (Optional - for Storage, Realtime, etc.)
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
```

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

## What's Configured

✅ **Database**: PostgreSQL via Supabase
✅ **Prisma Client**: Generated for PostgreSQL
✅ **Supabase Client**: Available in `lib/supabase.ts`
✅ **Connection Pooling**: Using Supabase's connection pooler

## Using Supabase Features

### Storage (File Uploads)

```typescript
import { supabase } from '@/lib/supabase'

// Upload file
const { data, error } = await supabase.storage
  .from('tutor-credentials')
  .upload('path/to/file.pdf', file)
```

### Realtime (Live Updates)

```typescript
// Subscribe to database changes
const channel = supabase
  .channel('bookings')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'Booking'
  }, (payload) => {
    console.log('New booking:', payload.new)
  })
  .subscribe()
```

## Troubleshooting

### "Can't reach database server"

1. Check if Supabase project is active
2. Verify connection string is correct
3. Make sure you're using the connection string from Supabase dashboard

### "Tenant or user not found"

1. The connection string format might be wrong
2. Get the connection string directly from Supabase dashboard
3. Don't manually construct it

### "Password authentication failed"

1. Reset database password in Supabase dashboard
2. Get new connection string
3. Update `.env` file

## Next Steps

After setup:
- ✅ Database connection works
- ✅ Login functionality works
- ✅ All database operations work
- ✅ Ready to use Supabase Storage and Realtime

## Commands Reference

```bash
# Complete backend setup
npm run setup:backend

# Test database connection
npm run test:db

# Generate Prisma Client
npx prisma generate

# Push schema
npx prisma db push

# Create admin
npm run setup:admin

# View database
npx prisma studio
```

