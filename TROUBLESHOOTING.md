# Supabase Connection Troubleshooting

## Current Issue: Can't reach database server

### Possible Causes:

1. **Supabase Project Not Fully Initialized**
   - New projects can take a few minutes to fully initialize
   - Check your Supabase dashboard to see if the project status is "Active"

2. **Project Paused (Free Tier)**
   - Free tier projects pause after 1 week of inactivity
   - Go to your Supabase dashboard and click "Restore" if paused

3. **Connection String Format**
   - The connection string should be copied directly from Supabase dashboard
   - Go to: Settings → Database → Connection string → URI

### Steps to Fix:

#### Option 1: Get Connection String Directly from Supabase

1. Go to: https://supabase.com/dashboard/project/ptjnlzrvqyynklzdipac/settings/database
2. Scroll to **"Connection string"** section
3. Click on **"URI"** tab
4. You'll see a connection string like:
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
5. Copy this EXACT string
6. Replace `[PASSWORD]` with your actual password (URL-encode special characters)
7. Update your `.env` file with this exact string

#### Option 2: Check Project Status

1. Go to: https://supabase.com/dashboard/project/ptjnlzrvqyynklzdipac
2. Check if the project shows as "Active" or "Paused"
3. If paused, click "Restore" and wait a few minutes

#### Option 3: Verify Password Encoding

If your password contains special characters, they need to be URL-encoded:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`
- `+` → `%2B`
- `=` → `%3D`
- `?` → `%3F`

#### Option 4: Try Transaction Mode Connection

For Prisma migrations, you might need the transaction mode connection string:
- Go to Settings → Database → Connection string
- Select **"Transaction"** mode (not Session)
- Use port **6543** with `?pgbouncer=true`

### Current .env Configuration:

Your current DATABASE_URL format:
```
postgresql://postgres:MyGlicoFIF%402025@db.ptjnlzrvqyynklzdipac.supabase.co:6543/postgres?pgbouncer=true
```

### Next Steps:

1. **Verify project is active** in Supabase dashboard
2. **Copy the exact connection string** from Supabase (don't construct it manually)
3. **Update .env** with the exact string from Supabase
4. **Try again**: `npx prisma db push`

### Alternative: Use Supabase SQL Editor

If connection issues persist, you can create tables manually:
1. Go to Supabase dashboard → SQL Editor
2. Run the SQL from Prisma migrations
3. Or use `prisma migrate dev` to generate SQL files

---

**Need Help?** Check Supabase status page or their documentation: https://supabase.com/docs/guides/database/connecting-to-postgres

