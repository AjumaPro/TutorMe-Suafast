# Supabase Setup Guide

## 🚀 Setting Up Supabase for TutorMe

### Step 1: Create a Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Sign up for a free account (or sign in if you already have one)
3. Create a new project

### Step 2: Get Your Database Connection String

1. In your Supabase project dashboard, go to **Settings** → **Database**
2. Scroll down to **Connection string** section
3. Select **URI** tab
4. Copy the connection string (it looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`)
5. Replace `[YOUR-PASSWORD]` with your database password (found in the same settings page)

### Step 3: Update Your .env File

Update your `.env` file with the Supabase connection string:

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
```

**Important Notes:**
- Replace `[YOUR-PASSWORD]` with your actual database password
- Replace `[PROJECT-REF]` with your project reference ID
- The `?pgbouncer=true&connection_limit=1` parameters help with connection pooling

### Step 4: Initialize the Database

Run these commands to set up your database schema:

```bash
# Generate Prisma Client
npx prisma generate

# Push the schema to Supabase
npx prisma db push
```

### Step 5: Verify Connection

You can verify the connection by opening Prisma Studio:

```bash
npx prisma studio
```

This will open a web interface where you can view and edit your database tables.

## 🔐 Security Best Practices

1. **Never commit your `.env` file** - It's already in `.gitignore`
2. **Use environment variables** in production
3. **Enable Row Level Security (RLS)** in Supabase for production (optional, since we're using Prisma)

## 📊 Supabase Features You Can Use Later

- **Storage**: For file uploads (tutor credentials, profile images)
- **Realtime**: For live updates (notifications, chat)
- **Auth**: Can replace NextAuth if desired (optional)
- **Edge Functions**: For serverless functions

## 🐛 Troubleshooting

### Connection Issues

If you get connection errors:
1. Check that your password is correct
2. Verify the connection string format
3. Make sure your Supabase project is active
4. Check if your IP needs to be whitelisted (Settings → Database → Connection Pooling)

### Migration Issues

If `prisma db push` fails:
- Make sure you have the correct permissions
- Try using `prisma migrate dev` instead for better migration control
- Check Supabase logs for detailed error messages

## ✅ Next Steps

After setting up Supabase:
1. Your app will use PostgreSQL instead of SQLite
2. All data will be stored in the cloud
3. You can access your database from anywhere
4. Ready for production deployment!

---

**Need Help?** Check the [Supabase Documentation](https://supabase.com/docs) or [Prisma Documentation](https://www.prisma.io/docs).

