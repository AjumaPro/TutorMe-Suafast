# Seed Test Data for Suafast

This guide explains how to create test data (parents and tutors) for testing the Suafast platform.

## Quick Start

Run the seed script:

```bash
npm run seed:supabase
```

Or directly:

```bash
node scripts/seed-test-data-supabase.js
```

## Prerequisites

Make sure you have the following environment variables set in your `.env.local` or `.env` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## What Gets Created

### Parent/Student Accounts (7 accounts)

All with password: `test1234`

1. **Alice Johnson** - alice@student.com
2. **Bob Smith** - bob@student.com
3. **Carol Williams** - carol@student.com
4. **David Brown** - david@student.com
5. **Emma Davis** - emma@student.com
6. **Frank Miller** - frank@student.com
7. **Grace Wilson** - grace@student.com

### Tutor Accounts (8 accounts)

All with password: `test1234`

1. **Dr. Sarah Mathis** - sarah@tutor.com
   - Subjects: Math, Algebra, Calculus, Geometry
   - Rate: ₵75/hr
   - Verified: Yes
   - Grades: 9-12, College

2. **Prof. James Science** - james@tutor.com
   - Subjects: Science, Physics, Chemistry, Biology
   - Rate: ₵65/hr
   - Verified: Yes
   - Grades: 6-8, 9-12

3. **Ms. Emily English** - emily@tutor.com
   - Subjects: English, Literature, Writing
   - Rate: ₵50/hr
   - Verified: No
   - Grades: K-5, 6-8, 9-12

4. **Mr. Michael Coding** - michael@tutor.com
   - Subjects: Computer Science, Programming, Web Development
   - Rate: ₵80/hr
   - Verified: Yes
   - Grades: 9-12, College

5. **Dr. Lisa History** - lisa@tutor.com
   - Subjects: History, Social Studies
   - Rate: ₵70/hr
   - Verified: Yes
   - Grades: 6-8, 9-12

6. **Mr. Robert Spanish** - robert@tutor.com
   - Subjects: Spanish, Languages
   - Rate: ₵55/hr
   - Verified: No
   - Grades: K-5, 6-8, 9-12

7. **Ms. Patricia French** - patricia@tutor.com
   - Subjects: French, Languages
   - Rate: ₵60/hr
   - Verified: Yes
   - Grades: 6-8, 9-12, College

8. **Dr. Thomas Chemistry** - thomas@tutor.com
   - Subjects: Chemistry, Science
   - Rate: ₵85/hr
   - Verified: Yes
   - Grades: 9-12, College

## Availability Slots

All tutors are automatically set up with availability slots:
- **Monday to Friday** (Day 1-5)
- **9:00 AM to 5:00 PM**
- All slots marked as available

## Features

- ✅ **Idempotent**: Running the script multiple times won't create duplicates
- ✅ **Auto-approval**: All tutors are automatically approved for testing
- ✅ **Complete profiles**: Tutors have bios, subjects, grades, and rates
- ✅ **Availability**: All tutors have weekday availability slots

## Testing Workflow

1. **Seed the data**:
   ```bash
   npm run seed:supabase
   ```

2. **Login as a parent**:
   - Go to: http://localhost:3000/auth/signin
   - Email: `alice@student.com`
   - Password: `test1234`

3. **Browse tutors**:
   - Navigate to the tutors page
   - Search by subject or tutor name
   - View tutor profiles

4. **Create a booking**:
   - Select a tutor
   - Choose a date and time
   - Complete the booking process

5. **Test payment**:
   - Use Paystack test cards
   - Complete payment flow

6. **Login as a tutor**:
   - Email: `sarah@tutor.com`
   - Password: `test1234`
   - View dashboard and bookings

## Customization

To customize the test data, edit `scripts/seed-test-data-supabase.js`:

- Modify the `students` array to add/remove parent accounts
- Modify the `tutors` array to add/remove tutor accounts
- Change `DEFAULT_PASSWORD` to use a different password
- Adjust availability slots in the script

## Troubleshooting

### Error: Missing Supabase environment variables

Make sure your `.env.local` or `.env` file has:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### Error: User already exists

This is normal if you've run the script before. The script will skip existing users and update their profiles.

### Error: Database connection failed

1. Check your Supabase project is active
2. Verify your connection strings are correct
3. Ensure your Supabase project has the correct schema (run `supabase/schema.sql` if needed)

## Next Steps

After seeding:
1. Test the login flow with different user roles
2. Create bookings between parents and tutors
3. Test the payment integration
4. Test the video session functionality
5. Test notifications and messaging

Happy testing! 🎉

