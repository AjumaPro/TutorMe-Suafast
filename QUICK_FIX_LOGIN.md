# 🔧 Quick Fix for Login Errors

## Current Issue
Login shows "Internal server error" because the database connection is failing.

## Root Cause
The Supabase database connection is not working. This could be because:
1. Supabase project is paused
2. Connection string is incorrect
3. Database password is wrong

## Quick Fix (Choose One)

### Option 1: Use Interactive Setup (Easiest)

```bash
npm run setup:supabase:get
```

Follow the prompts to:
1. Get connection string from Supabase dashboard
2. Test connection
3. Update configuration
4. Push database schema

### Option 2: Manual Fix

#### Step 1: Check Supabase Project

1. Go to: https://supabase.com/dashboard/project/ptjnlzrvqyynklzdipac
2. **If project is paused**, click "Restore" and wait 2-3 minutes

#### Step 2: Get Connection String

1. Go to: https://supabase.com/dashboard/project/ptjnlzrvqyynklzdipac/settings/database
2. Scroll to **"Connection string"** section
3. Click **"URI"** tab
4. Click **"Copy"** button (copies entire connection string)

#### Step 3: Update .env

Replace `DATABASE_URL` in `.env` with the copied connection string:

```env
DATABASE_URL="postgresql://postgres.ptjnlzrvqyynklzdipac:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
```

#### Step 4: Regenerate and Push

```bash
npx prisma generate
npx prisma db push
npm run setup:admin
```

#### Step 5: Restart Server

Stop your dev server (Ctrl+C) and restart:

```bash
npm run dev
```

## After Fixing

Once the connection is fixed:
1. ✅ Login should work
2. ✅ You can create accounts
3. ✅ Database queries will work

## Test Accounts

After fixing, you can use:
- `parent@test.com` / `test1234`
- `tutor@test.com` / `test1234`
- `infoajumapro@gmail.com` / `test1234`

Or create new accounts via signup.

## Still Having Issues?

1. Run: `npm run test:db` to test connection
2. Check Supabase dashboard for project status
3. Verify connection string matches Supabase dashboard exactly

