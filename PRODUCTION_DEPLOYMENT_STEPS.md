# 🚀 Production Deployment Steps - Suafast

## ✅ Completed
- ✅ Live Paystack keys configured in `.env`
- ✅ All build errors fixed
- ✅ Supabase migration complete
- ✅ All Prisma dependencies removed

---

## 📋 Remaining Production Setup

### 1. Environment Variables Checklist

Verify these are set in your production environment (Vercel/hosting platform):

```bash
# ✅ Paystack (DONE)
PAYSTACK_SECRET_KEY="sk_live_..." # ✅ You've set this
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY="pk_live_..." # If using client-side

# ⚠️ Supabase (Verify)
NEXT_PUBLIC_SUPABASE_URL="https://ptjnlzrvqyynklzdipac.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# ⚠️ Authentication (Verify)
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="https://yourdomain.com" # Your production URL

# Optional but Recommended
NEXT_PUBLIC_PAYSTACK_LOGO_URL="https://yourdomain.com/logo.png"
PAYSTACK_SPLIT_CODE="SPLIT_..." # If using split payments
```

### 2. Paystack Webhook Configuration

**CRITICAL**: Configure webhook in Paystack dashboard:

1. Go to: https://dashboard.paystack.com/#/settings/developer
2. Navigate to **Webhooks** section
3. Add webhook URL: `https://yourdomain.com/api/payments/webhook`
4. Select events:
   - `charge.success`
   - `charge.failed`
5. Save and test webhook delivery

### 3. Database Migrations

Run these SQL scripts in Supabase dashboard (if not already done):

1. `supabase/add-currency-support.sql`
2. `supabase/add-isactive-to-tutors.sql`
3. `supabase/add-address-coordinates.sql`
4. `supabase/add-tutor-location.sql`
5. `supabase/add-payment-frequency.sql`

**How to run:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste each SQL file content
3. Run each script
4. Verify tables are updated

### 4. Create Admin Account

Run in Supabase SQL Editor:

```sql
-- Use the script from supabase/create-admin.sql
-- Or manually create admin user
```

Or use the admin email: `infoajumapro@gmail.com`

### 5. Generate NEXTAUTH_SECRET

If not already set, generate a secure secret:

```bash
openssl rand -base64 32
```

Add to production environment variables.

### 6. Update NEXTAUTH_URL

Set to your production domain:
```bash
NEXTAUTH_URL="https://yourdomain.com"
```

---

## 🚀 Deployment Steps

### Option 1: Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for production deployment"
   git push origin main
   ```

2. **Deploy on Vercel**
   - Go to https://vercel.com
   - Import your GitHub repository
   - Configure environment variables (all from checklist above)
   - Set build command: `npm run build`
   - Set output directory: `.next`
   - Deploy

3. **Configure Custom Domain** (if applicable)
   - Add domain in Vercel dashboard
   - Update DNS records
   - Update `NEXTAUTH_URL` to match

### Option 2: Other Platforms

1. Build the application:
   ```bash
   npm run build
   ```

2. Set all environment variables in hosting platform

3. Deploy:
   ```bash
   npm run start
   ```

4. Use PM2 or similar for process management

---

## ✅ Post-Deployment Checklist

### Immediate Testing
- [ ] Test user signup
- [ ] Test user login
- [ ] Test tutor profile creation
- [ ] Test booking creation
- [ ] Test payment flow (use Paystack test mode first, then switch to live)
- [ ] Test admin functions
- [ ] Verify webhook is receiving events from Paystack

### Monitoring
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Monitor application logs
- [ ] Check Paystack dashboard for successful transactions
- [ ] Verify database connections
- [ ] Monitor Supabase dashboard for errors

### Security
- [ ] Verify HTTPS is enabled
- [ ] Confirm environment variables are secure (not exposed)
- [ ] Review API route authentication
- [ ] Test rate limiting (if implemented)

---

## 🔧 Troubleshooting

### Payment Issues
- Verify Paystack webhook URL is correct
- Check webhook events in Paystack dashboard
- Verify `PAYSTACK_SECRET_KEY` is correct
- Check application logs for payment errors

### Database Issues
- Verify Supabase project is active (not paused)
- Check `SUPABASE_SERVICE_ROLE_KEY` is correct
- Verify all migrations have been run
- Check Supabase dashboard for connection errors

### Authentication Issues
- Verify `NEXTAUTH_SECRET` is set and secure
- Check `NEXTAUTH_URL` matches your domain
- Verify session cookies are working
- Check NextAuth configuration

---

## 📞 Support Resources

- **Paystack Documentation**: https://paystack.com/docs
- **Supabase Documentation**: https://supabase.com/docs
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Vercel Documentation**: https://vercel.com/docs

---

## 🎉 You're Almost There!

With live Paystack keys configured, you're ready to:
1. Set remaining environment variables
2. Configure Paystack webhook
3. Run database migrations
4. Deploy to production

Good luck with your deployment! 🚀

