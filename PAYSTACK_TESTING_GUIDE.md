# Paystack Testing Guide

## ✅ You're Ready to Test!

Since you have test keys in your `.env` file, you can start testing payments immediately.

---

## 🧪 Quick Test Steps

### 1. **Verify Your Environment Variables**

Make sure your `.env` file has:
```bash
PAYSTACK_SECRET_KEY=sk_test_...  # Your test secret key
NEXTAUTH_URL=http://localhost:3000  # Your local URL
```

**Note**: The public key (`NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`) is not required for server-side operations, but you can add it if you plan to use Paystack's inline popup method.

---

### 2. **Test Payment Flow**

1. **Create a Booking**:
   - Sign in as a parent/student
   - Book a lesson with a tutor
   - You'll be redirected to the payment page

2. **Go to Payment Page**:
   - URL: `/bookings/[booking-id]/payment`
   - You should see the payment form with booking details

3. **Click "Pay" Button**:
   - You'll be redirected to Paystack's test checkout page

4. **Use Test Card**:
   ```
   Card Number: 4084084084084081
   CVV: Any 3 digits (e.g., 123)
   Expiry: Any future date (e.g., 12/25)
   PIN: Any 4 digits (e.g., 0000)
   ```

5. **Complete Payment**:
   - After successful payment, you'll be redirected back
   - Booking status should update to "CONFIRMED"

---

## 🎯 Paystack Test Cards (Ghana - GHS)

### Successful Payment
```
Card Number: 4084084084084081
CVV: Any 3 digits
Expiry: Any future date
PIN: Any 4 digits
```

### Declined Payment
```
Card Number: 5060666666666666666
CVV: Any 3 digits
Expiry: Any future date
PIN: Any 4 digits
```

### Insufficient Funds
```
Card Number: 5060666666666666667
CVV: Any 3 digits
Expiry: Any future date
PIN: Any 4 digits
```

---

## 📱 Test Mobile Money (Ghana)

For mobile money testing:
- **MTN**: Use any phone number starting with `024`
- **Vodafone**: Use any phone number starting with `020`
- **AirtelTigo**: Use any phone number starting with `027`

---

## ⚠️ Important Notes for Testing

### Webhook is Optional for Testing

You don't need to configure webhooks for testing. The payment flow will work, but:

- ✅ Payment will redirect successfully
- ✅ You can manually verify payment using the verify endpoint
- ⚠️ Booking status won't auto-update (you can manually verify)

**To manually verify a payment after testing:**
1. Get the payment reference from the Paystack checkout page
2. The system will automatically verify when you return to the booking page
3. Or use the verify endpoint: `POST /api/payments/verify`

### Callback URL

The callback URL is automatically set to:
```
http://localhost:3000/bookings/[booking-id]?payment=success
```

Make sure `NEXTAUTH_URL` is set to `http://localhost:3000` in your `.env`.

---

## 🔍 Troubleshooting

### Payment Initialization Fails

**Check:**
1. Is `PAYSTACK_SECRET_KEY` set correctly in `.env`?
2. Does it start with `sk_test_`?
3. Restart your dev server after changing `.env`

**Error Messages:**
- "No response from Paystack" → Check your secret key
- "Invalid response" → Check Paystack dashboard for account status
- "Unauthorized" → Verify the secret key is correct

### Payment Redirect Not Working

**Check:**
1. Browser popup blocker (should allow redirects)
2. Check browser console for errors (F12)
3. Verify `NEXTAUTH_URL` is set correctly

### Payment Succeeds but Booking Not Updated

**This is normal without webhooks!** 

**Solutions:**
1. **Manual Verification**: The system will verify when you visit the booking page
2. **Set up Webhook** (optional for testing):
   - Use a tool like [ngrok](https://ngrok.com) to expose localhost
   - Add webhook URL in Paystack dashboard: `https://your-ngrok-url.ngrok.io/api/payments/webhook`

---

## 🧪 Testing Checklist

- [ ] Payment page loads correctly
- [ ] Payment initialization succeeds (check browser console)
- [ ] Redirect to Paystack checkout works
- [ ] Test card payment completes successfully
- [ ] Redirect back to app works
- [ ] Payment verification works (booking status updates)
- [ ] Payment record shows "PAID" status
- [ ] Booking status updates to "CONFIRMED"

---

## 📊 What to Check After Payment

1. **Database**:
   - Check `payments` table - status should be "PAID"
   - Check `bookings` table - status should be "CONFIRMED"
   - Verify `paystackReference` and `paystackPaymentId` are set

2. **Paystack Dashboard**:
   - Go to Paystack Dashboard → Transactions
   - You should see the test transaction
   - Check transaction details match your booking

3. **App**:
   - Booking should show as "CONFIRMED"
   - Payment should show as "PAID"
   - For online lessons, video session should be created

---

## 🚀 Next Steps

Once testing works:

1. **For Production**:
   - Switch to live keys (`sk_live_...`)
   - Configure production webhook URL
   - Update `NEXTAUTH_URL` to production domain

2. **Optional Enhancements**:
   - Add logo URL (`NEXT_PUBLIC_PAYSTACK_LOGO_URL`)
   - Configure split payments (`PAYSTACK_SPLIT_CODE`)
   - Customize payment channels in `lib/paystack-config.ts`

---

## 💡 Pro Tips

1. **Check Server Logs**: Watch your terminal for Paystack API responses
2. **Browser Console**: Check for any client-side errors
3. **Paystack Dashboard**: Monitor transactions in real-time
4. **Test Different Scenarios**: Try declined cards, insufficient funds, etc.

---

## 🆘 Need Help?

If payments aren't working:

1. **Check Environment Variables**:
   ```bash
   # In your terminal
   echo $PAYSTACK_SECRET_KEY  # Should show your test key
   ```

2. **Check Server Logs**: Look for Paystack API errors

3. **Verify Paystack Account**: 
   - Log into Paystack dashboard
   - Check that test mode is enabled
   - Verify API keys are active

4. **Test API Directly**:
   ```bash
   curl https://api.paystack.co/transaction/initialize \
     -H "Authorization: Bearer sk_test_YOUR_KEY" \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","amount":10000}'
   ```

---

**You're all set! Start testing your payment flow now! 🎉**

