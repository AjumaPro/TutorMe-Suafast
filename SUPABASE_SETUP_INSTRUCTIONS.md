# 🔧 Supabase Connection Setup - Step by Step

## Current Issue
Your app is trying to connect to Supabase but getting "Can't reach database server" errors.

## Quick Fix Options

### Option 1: Interactive Complete Setup (Recommended)
```bash
npm run setup:supabase:complete
```

This will:
- Test multiple connection methods
- Find the working connection string
- Update your .env file
- Generate Prisma Client
- Push database schema
- Create admin account

### Option 2: Manual Setup

#### Step 1: Check Supabase Project Status

1. Go to: https://supabase.com/dashboard/project/ptjnlzrvqyynklzdipac
2. **Check if project is ACTIVE** (not paused)
   - If paused, click "Restore" and wait 2-3 minutes
   - Free tier projects pause after 1 week of inactivity

#### Step 2: Get Your Connection String

1. Go to: https://supabase.com/dashboard/project/ptjnlzrvqyynklzdipac/settings/database
2. Scroll to **"Connection string"** section
3. Click on **"URI"** tab
4. You'll see a connection string like:
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
5. **Copy this EXACT string** (it's already formatted correctly)

#### Step 3: Update .env File

Replace your `DATABASE_URL` in `.env` with the connection string from Supabase:

```env
DATABASE_URL="postgresql://postgres.ptjnlzrvqyynklzdipac:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

**Important:**
- Use the connection string directly from Supabase dashboard
- Don't manually construct it
- The password in the connection string is already URL-encoded

#### Step 4: Generate Prisma Client

```bash
npx prisma generate
```

#### Step 5: Push Schema to Database

```bash
npx prisma db push
```

#### Step 6: Create Admin Account

```bash
npm run setup:admin
```

#### Step 7: Test Connection

```bash
npm run test:db
```

## Common Issues & Solutions

### Issue 1: "Can't reach database server"

**Causes:**
- Supabase project is paused
- Wrong connection string format
- Network/firewall blocking connection

**Solutions:**
1. Check project status in Supabase dashboard
2. Use connection string directly from Supabase (don't construct manually)
3. Try the complete setup script: `npm run setup:supabase:complete`

### Issue 2: "Password authentication failed"

**Causes:**
- Wrong password
- Password not URL-encoded properly

**Solutions:**
1. Reset password in Supabase dashboard
2. Use connection string from Supabase (password is pre-encoded)
3. Or run: `npm run fix:db` to auto-encode password

### Issue 3: "Table does not exist"

**Causes:**
- Schema not pushed to database

**Solutions:**
```bash
npx prisma db push
```

### Issue 4: Connection works but app still shows errors

**Causes:**
- Prisma Client not regenerated
- Server needs restart

**Solutions:**
```bash
npx prisma generate
# Then restart your dev server
```

## Connection String Formats

Supabase provides different connection string formats:

### 1. Direct Connection (Port 5432)
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```
- Direct connection to database
- No connection pooling
- Use for migrations

### 2. Connection Pooling (Port 6543) - Recommended
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```
- Uses connection pooling
- Better for production
- Recommended for applications

### 3. Transaction Mode (Port 6543)
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```
- Transaction mode pooling
- Use for Prisma migrations

## Verification Checklist

After setup, verify everything works:

- [ ] Supabase project is active
- [ ] Connection string in .env matches Supabase dashboard
- [ ] `npx prisma generate` completed successfully
- [ ] `npx prisma db push` completed successfully
- [ ] `npm run test:db` shows successful connection
- [ ] Admin account created (if needed)
- [ ] App can login successfully

## Need Help?

1. Run the complete setup: `npm run setup:supabase:complete`
2. Test connection: `npm run test:db`
3. Check Supabase dashboard for project status
4. Review Supabase logs in dashboard

## Quick Commands Reference

```bash
# Complete setup (interactive)
npm run setup:supabase:complete

# Test database connection
npm run test:db

# Fix password encoding
npm run fix:db

# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Create admin account
npm run setup:admin

# Open Prisma Studio (view database)
npx prisma studio
```

