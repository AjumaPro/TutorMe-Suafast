# Update Your .env File for Supabase

## Your Supabase Project Details
- **Project Reference ID**: `ptjnlzrvqyynklzdipac`
- **Connection String Format**: 
  ```
  postgresql://postgres:[YOUR-PASSWORD]@db.ptjnlzrvqyynklzdipac.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1
  ```

## Steps to Update .env

### 1. Get Your Database Password

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/ptjnlzrvqyynklzdipac/settings/database
2. Scroll to the **Database password** section
3. If you see a password, copy it
4. If you don't see it or need to reset it:
   - Click **"Reset database password"**
   - Copy the new password (save it securely!)

### 2. Update Your .env File

Open your `.env` file and replace the `DATABASE_URL` line with:

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.ptjnlzrvqyynklzdipac.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
```

**Replace `[YOUR-PASSWORD]`** with the actual password you copied from Supabase.

### 3. Example

If your password is `mySecurePassword123`, your DATABASE_URL would be:

```env
DATABASE_URL="postgresql://postgres:mySecurePassword123@db.ptjnlzrvqyynklzdipac.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
```

### 4. Push Schema to Database

After updating `.env`, run:

```bash
npx prisma db push
```

This will create all your database tables in Supabase.

### 5. Verify Connection

Test the connection:

```bash
npx prisma studio
```

This opens a web interface to view your Supabase database.

## Quick Command (if you have the password)

If you have your password ready, you can update the .env file using:

```bash
# Replace YOUR_PASSWORD_HERE with your actual password
sed -i '' 's|DATABASE_URL="file:./dev.db"|DATABASE_URL="postgresql://postgres:YOUR_PASSWORD_HERE@db.ptjnlzrvqyynklzdipac.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"|' .env
```

Or manually edit the `.env` file with your preferred text editor.

