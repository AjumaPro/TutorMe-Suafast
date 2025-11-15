# 🔧 Fix Login Error - Sample Tutor Accounts

## Problem
Getting "Invalid email or password" error when trying to login with sample tutor accounts like `sarah.johnson@tutorme.com`.

## Solution

The sample tutor accounts need to be created first. Follow these steps:

### Step 1: Check Environment Variables

Make sure you have Supabase credentials in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 2: Create Sample Tutor Accounts

Run the script to create sample tutors:

```bash
npm run seed:tutors
```

Or directly:

```bash
node scripts/create-sample-tutors.js
```

### Step 3: Verify Account Creation

Check if the account was created:

```bash
node scripts/check-tutor-account.js sarah.johnson@tutorme.com
```

### Step 4: Try Login Again

After creating the accounts, try logging in with:

- **Email**: `sarah.johnson@tutorme.com`
- **Password**: `Tutor123!`

## Sample Tutor Accounts Created

The script creates 6 sample tutors:

1. **Dr. Sarah Johnson**
   - Email: `sarah.johnson@tutorme.com`
   - Password: `Tutor123!`
   - Subjects: Math, Science
   - Rate: ₵50/hour

2. **Prof. Michael Chen**
   - Email: `michael.chen@tutorme.com`
   - Password: `Tutor123!`
   - Subjects: Computer Science, Math
   - Rate: ₵60/hour

3. **Ms. Emily Williams**
   - Email: `emily.williams@tutorme.com`
   - Password: `Tutor123!`
   - Subjects: English, Test Prep
   - Rate: ₵40/hour

4. **Dr. James Anderson**
   - Email: `james.anderson@tutorme.com`
   - Password: `Tutor123!`
   - Subjects: Science
   - Rate: ₵55/hour

5. **Ms. Lisa Martinez**
   - Email: `lisa.martinez@tutorme.com`
   - Password: `Tutor123!`
   - Subjects: Math, English, Science
   - Rate: ₵35/hour

6. **Mr. David Brown**
   - Email: `david.brown@tutorme.com`
   - Password: `Tutor123!`
   - Subjects: History
   - Rate: ₵38/hour

## Troubleshooting

### Error: "Missing Supabase environment variables"

**Solution**: 
1. Create `.env.local` file in the project root
2. Add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
3. Get these from: https://supabase.com/dashboard/project/_/settings/api

### Error: "User not found"

**Solution**: The account hasn't been created yet. Run:
```bash
npm run seed:tutors
```

### Error: "Invalid password"

**Solution**: 
1. Make sure you're using the correct password: `Tutor123!`
2. Check if the account was created successfully
3. Try resetting the password or creating a new account

### Account Already Exists

If you get a message that the account already exists:
- The script will skip creating it
- Try logging in with the credentials
- If login still fails, the password might be different - you may need to reset it

## Manual Account Creation

If the script doesn't work, you can create an account manually:

1. Go to `/auth/signup`
2. Sign up as a tutor
3. Complete your tutor profile
4. Wait for admin approval (or auto-approve if you're admin)

## Need Help?

1. Check the console logs when running the script
2. Verify your Supabase connection
3. Check the database directly in Supabase dashboard
4. Review the script output for any errors

