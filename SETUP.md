# Quick Setup Guide

## 🚀 Getting Started in 5 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Database

#### Option A: Local PostgreSQL
1. Install PostgreSQL on your machine
2. Create a database:
   ```sql
   CREATE DATABASE tutorme;
   ```
3. Update `.env`:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/tutorme?schema=public"
   ```

#### Option B: Free Cloud Database (Recommended for Testing)
1. Sign up for [Neon](https://neon.tech) or [Supabase](https://supabase.com) (free tier)
2. Copy the connection string to your `.env` file

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and fill in:

```bash
# Required
DATABASE_URL="your-postgresql-connection-string"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# Stripe (for payments - get from https://dashboard.stripe.com/test/apikeys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."

# Optional (for future features)
TWILIO_ACCOUNT_SID=""
DAILY_API_KEY=""
SENDGRID_API_KEY=""
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 4. Initialize Database
```bash
npx prisma generate
npx prisma db push
```

### 5. Run Development Server
```bash
npm run dev
```

### 6. Create Your First Admin Account

1. Go to http://localhost:3000/auth/signup
2. Sign up with any email/password
3. Open Prisma Studio:
   ```bash
   npm run db:studio
   ```
4. Find your user in the `users` table
5. Change `role` from `PARENT` to `ADMIN`
6. Save

### 7. Test the Platform

1. **As Admin:**
   - Sign in with your admin account
   - Go to `/admin` to see the dashboard

2. **Create a Tutor:**
   - Sign up a new account (or use a different browser/incognito)
   - Choose "Tutor" role
   - Complete tutor profile at `/tutor/profile`
   - As admin, approve the tutor at `/admin`

3. **Book a Lesson:**
   - Sign up as a "Parent/Student"
   - Search for tutors at `/search`
   - Book a lesson
   - Complete payment (use Stripe test card: `4242 4242 4242 4242`)

## 🧪 Testing Payments

Use Stripe test cards:
- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- Use any future expiry date, any CVC, any ZIP

## 📚 Next Steps

- Read the full [README.md](./README.md) for detailed documentation
- Check out the [development roadmap](./README.md#-development-roadmap)
- Customize the UI in `app/` and `components/`
- Add video integration for online lessons

## 🐛 Troubleshooting

**Database connection errors:**
- Verify your `DATABASE_URL` is correct
- Make sure PostgreSQL is running (if local)
- Check firewall settings (if cloud database)

**Authentication errors:**
- Make sure `NEXTAUTH_SECRET` is set
- Verify `NEXTAUTH_URL` matches your app URL

**Payment errors:**
- Verify Stripe keys are correct
- Make sure you're using test keys (start with `pk_test_` and `sk_test_`)

## 💡 Tips

- Use Prisma Studio (`npm run db:studio`) to view/edit data
- Check browser console for client-side errors
- Check terminal for server-side errors
- All API routes are in `app/api/`

Happy coding! 🎉

