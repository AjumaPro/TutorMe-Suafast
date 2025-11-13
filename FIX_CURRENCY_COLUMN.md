# Fix Currency Column Error

## Error
```
Could not find the 'currency' column of 'bookings' in the schema cache
```

## Solution

The `currency` column needs to be added to your Supabase database tables. 

### Step 1: Run SQL Migration

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste the contents of `supabase/add-currency-columns.sql`
6. Click **Run** (or press Cmd/Ctrl + Enter)

### Step 2: Verify

After running the SQL, the following columns will be added:
- `tutor_profiles.currency` (default: 'GHS')
- `bookings.currency` (default: 'GHS')
- `payments.currency` (default: 'GHS')

### Alternative: Quick Fix (Temporary)

If you need to test immediately without running the migration, you can temporarily remove the currency field from the booking insert:

1. Open `app/api/bookings/route.ts`
2. Find line 70: `currency: currency,`
3. Comment it out: `// currency: currency,`
4. Save and test

**Note:** This is a temporary workaround. You should run the SQL migration for full currency support.

