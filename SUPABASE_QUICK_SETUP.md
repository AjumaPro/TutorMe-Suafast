# 🚀 Quick Supabase Setup Guide

## Option 1: Interactive Setup (Recommended)

Run the interactive setup script:

```bash
npm run setup:supabase
```

This will guide you through:
1. Entering your Supabase project reference ID
2. Entering your database password
3. Automatically updating your `.env` file

## Option 2: Manual Setup

### Step 1: Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (or create a new one)
3. Go to **Settings** → **Database**
4. Find your **Connection string** (URI format)
5. Copy your **Database password**

### Step 2: Update .env File

Open your `.env` file and update the `DATABASE_URL`:

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
```

**Replace:**
- `[YOUR-PASSWORD]` with your actual database password
- `[PROJECT-REF]` with your project reference ID (e.g., `ptjnlzrvqyynklzdipac`)

### Step 3: Initialize Database

```bash
# Generate Prisma Client for PostgreSQL
npx prisma generate

# Push schema to Supabase
npx prisma db push
```

### Step 4: Create Admin Account

```bash
npm run setup:admin
```

### Step 5: Verify Connection

```bash
npx prisma studio
```

This opens Prisma Studio where you can view your Supabase database.

## ✅ Verification Checklist

- [ ] `.env` file updated with Supabase connection string
- [ ] `prisma generate` completed successfully
- [ ] `prisma db push` completed successfully
- [ ] Admin account created
- [ ] Can view database in Prisma Studio

## 🔧 Troubleshooting

### Connection Errors

**Error: "Connection refused"**
- Check your database password is correct
- Verify project reference ID is correct
- Ensure Supabase project is active (not paused)

**Error: "Password authentication failed"**
- Reset your database password in Supabase dashboard
- Update `.env` with new password

**Error: "Too many connections"**
- The connection string includes `connection_limit=1` for pooling
- If issues persist, remove `?pgbouncer=true&connection_limit=1` temporarily

### Migration Errors

**Error: "Table already exists"**
- This is normal if you've run `db push` before
- Prisma will update existing tables

**Error: "Column does not exist"**
- Run `npx prisma db push --force-reset` (⚠️ This will delete all data!)
- Or manually fix the schema mismatch

## 📊 What Changed?

- **Database**: SQLite → PostgreSQL (Supabase)
- **Location**: Local file → Cloud database
- **Schema**: Updated to use PostgreSQL provider
- **Connection**: Now uses connection pooling

## 🎉 Next Steps

After setup:
1. Your app will use Supabase PostgreSQL
2. All data is stored in the cloud
3. Ready for production deployment
4. Can access database from anywhere

## 🔐 Security Notes

- Never commit `.env` file (already in `.gitignore`)
- Keep your database password secure
- Use environment variables in production
- Consider enabling Row Level Security (RLS) in Supabase for additional security

