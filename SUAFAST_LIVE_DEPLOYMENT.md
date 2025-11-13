# 🚀 Suafast.live Deployment Guide

## Domain: suafast.live

---

## ✅ Pre-Deployment Checklist

### 1. Environment Variables for suafast.live

Set these in your hosting platform (Vercel/other):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://ptjnlzrvqyynklzdipac.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Authentication
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="https://suafast.live"

# Paystack (Already configured)
PAYSTACK_SECRET_KEY="sk_live_..."

# Optional
NEXT_PUBLIC_PAYSTACK_LOGO_URL="https://suafast.live/logo.png"
PAYSTACK_SPLIT_CODE="SPLIT_..." # If using split payments
```

### 2. Paystack Webhook Configuration

**CRITICAL**: Configure in Paystack Dashboard:

1. Go to: https://dashboard.paystack.com/#/settings/developer
2. Navigate to **Webhooks**
3. Add webhook URL: `https://suafast.live/api/payments/webhook`
4. Select events:
   - ✅ `charge.success`
   - ✅ `charge.failed`
5. Save and test webhook delivery

### 3. Database Migrations

Run these SQL scripts in Supabase Dashboard → SQL Editor:

- [ ] `supabase/add-currency-support.sql`
- [ ] `supabase/add-isactive-to-tutors.sql`
- [ ] `supabase/add-address-coordinates.sql`
- [ ] `supabase/add-tutor-location.sql`
- [ ] `supabase/add-payment-frequency.sql`

### 4. Generate NEXTAUTH_SECRET

If not already generated:

```bash
openssl rand -base64 32
```

Copy the output and add to environment variables.

---

## 🚀 Deployment Steps

### Option 1: Vercel (Recommended)

1. **Prepare Repository**
   ```bash
   git add .
   git commit -m "Production build for suafast.live"
   git push origin main
   ```

2. **Deploy on Vercel**
   - Go to https://vercel.com
   - Import your GitHub repository
   - Configure project:
     - **Framework Preset**: Next.js
     - **Build Command**: `npm run build`
     - **Output Directory**: `.next`
     - **Install Command**: `npm install`

3. **Set Environment Variables**
   - Add all variables from checklist above
   - **Important**: Set `NEXTAUTH_URL="https://suafast.live"`

4. **Configure Custom Domain**
   - Go to Project Settings → Domains
   - Add `suafast.live`
   - Add `www.suafast.live` (optional)
   - Update DNS records as instructed by Vercel

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Verify deployment at https://suafast.live

### Option 2: Other Hosting Platform

1. **Build Locally**
   ```bash
   npm run build
   ```

2. **Set Environment Variables**
   - Add all variables from checklist
   - Ensure `NEXTAUTH_URL="https://suafast.live"`

3. **Deploy**
   ```bash
   npm run start
   ```

4. **Configure Domain**
   - Point `suafast.live` DNS to your server
   - Configure SSL certificate (Let's Encrypt recommended)

---

## ✅ Post-Deployment Verification

### Immediate Checks

- [ ] Visit https://suafast.live - site loads
- [ ] Test user signup
- [ ] Test user login
- [ ] Test tutor profile creation
- [ ] Test booking creation
- [ ] Test payment flow (use test card first)
- [ ] Test admin dashboard
- [ ] Verify Paystack webhook is receiving events

### Payment Testing

1. **Test Mode First** (Recommended)
   - Use Paystack test cards
   - Verify payment flow works
   - Check webhook delivery

2. **Switch to Live Mode**
   - Use live Paystack keys
   - Test with small real transaction
   - Verify webhook receives events
   - Check payment appears in Paystack dashboard

### Security Checks

- [ ] HTTPS is enabled (required)
- [ ] Environment variables are secure (not exposed)
- [ ] API routes are protected
- [ ] Session cookies work correctly
- [ ] CORS is configured properly

---

## 🔧 Configuration Files

### DNS Configuration

If using Vercel, add these DNS records:

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

(Check Vercel dashboard for exact values)

### SSL Certificate

- Vercel: Automatic SSL via Let's Encrypt
- Other platforms: Configure Let's Encrypt or use platform's SSL

---

## 📊 Monitoring Setup

### Recommended Tools

1. **Error Tracking**
   - Sentry (https://sentry.io)
   - Or Vercel Analytics

2. **Performance Monitoring**
   - Vercel Analytics
   - Google Analytics

3. **Uptime Monitoring**
   - UptimeRobot
   - Pingdom

---

## 🐛 Troubleshooting

### Common Issues

**Issue**: Site not loading
- Check DNS propagation (can take 24-48 hours)
- Verify SSL certificate is active
- Check hosting platform status

**Issue**: Authentication not working
- Verify `NEXTAUTH_URL` is set to `https://suafast.live`
- Check `NEXTAUTH_SECRET` is set
- Verify session cookies are working

**Issue**: Payments not processing
- Verify Paystack webhook URL is `https://suafast.live/api/payments/webhook`
- Check webhook events in Paystack dashboard
- Verify `PAYSTACK_SECRET_KEY` is correct
- Check application logs for errors

**Issue**: Database connection errors
- Verify Supabase project is active (not paused)
- Check `SUPABASE_SERVICE_ROLE_KEY` is correct
- Verify all migrations have been run

---

## 📝 Post-Deployment Tasks

### Week 1
- [ ] Monitor error logs daily
- [ ] Test all critical user flows
- [ ] Verify payment webhooks are working
- [ ] Check database performance
- [ ] Review user feedback

### Ongoing
- [ ] Regular backups (Supabase handles this)
- [ ] Monitor Paystack transactions
- [ ] Update dependencies regularly
- [ ] Review and optimize performance
- [ ] Security audits

---

## 🎉 Success Criteria

Your deployment is successful when:

✅ Site loads at https://suafast.live  
✅ Users can sign up and log in  
✅ Tutors can create profiles  
✅ Bookings can be created  
✅ Payments process successfully  
✅ Admin dashboard works  
✅ Webhooks are receiving events  
✅ No critical errors in logs  

---

## 📞 Support

If you encounter issues:

1. Check application logs in hosting platform
2. Check Supabase dashboard for database errors
3. Check Paystack dashboard for payment issues
4. Review error tracking (if configured)

---

## 🚀 Ready to Deploy!

With live Paystack keys configured and domain set to `suafast.live`, you're ready to:

1. ✅ Set environment variables
2. ✅ Configure Paystack webhook
3. ✅ Run database migrations
4. ✅ Deploy to hosting platform
5. ✅ Configure DNS
6. ✅ Test everything

Good luck with your deployment! 🎉

