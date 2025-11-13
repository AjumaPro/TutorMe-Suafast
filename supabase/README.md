# 🗄️ Supabase SQL Scripts

These SQL scripts can be run directly in Supabase SQL Editor if Prisma connection is failing.

## 📋 Setup Steps

### Step 1: Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard/project/ptjnlzrvqyynklzdipac/sql/new
2. This opens the SQL Editor

### Step 2: Create Database Schema

1. Open `schema.sql` file
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click "Run" button (or press Cmd/Ctrl + Enter)
5. Wait for success message

### Step 3: Generate Admin Password Hash

Run this command to generate the bcrypt hash:

```bash
node supabase/generate-admin-hash.js
```

This will output the SQL INSERT statement with the correct password hash.

### Step 4: Create Admin Account

1. Copy the SQL INSERT statement from the output above
2. Or open `create-admin.sql` and replace the password hash
3. Paste into Supabase SQL Editor
4. Click "Run"

### Step 5: Verify Tables Created

Run this query in Supabase SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see all tables:
- User
- TutorProfile
- Booking
- Payment
- Review
- Address
- Message
- Notification
- Assignment
- ProgressEntry
- VideoSession

### Step 6: Verify Admin Account

Run this query:

```sql
SELECT id, email, name, role 
FROM "User" 
WHERE email = 'infoajumapro@gmail.com';
```

You should see the admin account.

## 🔧 After Running SQL Scripts

### Update Prisma

After creating tables in Supabase:

1. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

2. **Introspect database** (optional - to sync Prisma schema):
   ```bash
   npx prisma db pull
   ```

3. **Test connection:**
   ```bash
   npm run test:db
   ```

## 📝 Files

- **`schema.sql`** - Complete database schema (tables, indexes, foreign keys)
- **`create-admin.sql`** - SQL to create admin account (needs password hash)
- **`generate-admin-hash.js`** - Script to generate bcrypt hash for admin password

## ⚠️ Important Notes

1. **Password Hash**: The `create-admin.sql` has a placeholder hash. You MUST generate the real hash using `generate-admin-hash.js`

2. **Table Names**: Tables use Prisma's naming convention (PascalCase with quotes)

3. **Data Types**: 
   - TEXT for strings
   - DOUBLE PRECISION for decimals
   - TIMESTAMP(3) for dates
   - BOOLEAN for booleans

4. **Foreign Keys**: All foreign keys are set to CASCADE on delete/update

5. **Indexes**: Created for commonly queried fields

## 🚀 Quick Start

```bash
# 1. Generate admin password hash
node supabase/generate-admin-hash.js

# 2. Copy the SQL from schema.sql to Supabase SQL Editor and run

# 3. Copy the SQL INSERT from step 1 to Supabase SQL Editor and run

# 4. Generate Prisma Client
npx prisma generate

# 5. Test connection
npm run test:db
```

## ✅ Verification

After running all scripts:

1. ✅ All tables created
2. ✅ Admin account exists
3. ✅ Prisma Client generated
4. ✅ Connection test passes
5. ✅ Login works in app

## 🔍 Troubleshooting

### Error: "relation already exists"
- Tables already exist
- Either drop them first or skip schema creation

### Error: "password hash invalid"
- Generate new hash using `generate-admin-hash.js`
- Update `create-admin.sql` with new hash

### Error: "foreign key constraint fails"
- Make sure tables are created in order
- Check that referenced tables exist

### Tables not showing in Prisma Studio
- Run `npx prisma generate` after creating tables
- Restart Prisma Studio

