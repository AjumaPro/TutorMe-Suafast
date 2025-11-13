# Paystack Payment Testing Guide

## Prerequisites

1. **Paystack Test Account**: Sign up at https://paystack.com (use test mode)
2. **Environment Variables**: Ensure these are set in `.env.local`:
   ```env
   PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxx  # Your Paystack test secret key
   NEXTAUTH_URL=http://localhost:3000
   ```

## Test Cards (Paystack Test Mode)

### ✅ Successful Payment Cards

**Card Number**: `4084084084084081`
- **CVV**: Any 3 digits (e.g., `408`)
- **Expiry**: Any future date (e.g., `12/25`)
- **PIN**: Any 4 digits (e.g., `0000`)
- **OTP**: `123456` (when prompted)

**Alternative Card**: `5060666666666666666`
- **CVV**: Any 3 digits
- **Expiry**: Any future date
- **PIN**: Any 4 digits
- **OTP**: `123456`

### ❌ Failed Payment Cards

**Card Number**: `5060666666666666667`
- This card will always fail
- Use to test error handling

### 💳 Bank Account (for Bank Transfer)

**Account Number**: `0000000000`
- **Bank**: Any bank
- **Account Name**: Any name

## Testing Steps

### 1. Create a Test Booking

1. Log in as a parent/student
2. Go to `/search` and find a tutor
3. Click "Book Lesson" on a tutor
4. Fill in the booking form:
   - Select subject
   - Choose date and time
   - Select duration
   - Enter any notes (optional)
5. Click "Book Lesson"
6. You should be redirected to `/bookings/{bookingId}/payment`

### 2. Test Payment Initialization

1. On the payment page, you should see:
   - Booking details
   - Total amount
   - "Pay with Paystack" button
2. Check browser console for:
   - `Initializing payment for booking: {bookingId}`
   - `Payment initialization response: {...}`
   - `✅ Payment initialized successfully`

### 3. Test Payment Flow

1. Click "Pay with Paystack"
2. You should be redirected to Paystack checkout page
3. Use test card details:
   - **Card Number**: `4084084084084081`
   - **CVV**: `408`
   - **Expiry**: `12/25` (any future date)
   - **Name**: Any name
4. Click "Pay"
5. Enter PIN: `0000` (any 4 digits)
6. Enter OTP: `123456` (when prompted)
7. Payment should be successful

### 4. Verify Payment

After successful payment:
1. You should be redirected back to `/bookings/{bookingId}?payment=success`
2. Check the booking status - should be `CONFIRMED`
3. Check payment status - should be `PAID`
4. You should see a success message

### 5. Test Payment Verification

The payment is verified in two ways:

#### A. Callback Verification (Automatic)
- After payment, Paystack redirects to callback URL
- The callback URL triggers payment verification
- Check browser console for verification logs

#### B. Manual Verification
You can manually verify a payment by calling:
```bash
curl -X POST http://localhost:3000/api/payments/verify \
  -H "Content-Type: application/json" \
  -d '{
    "reference": "TUTORME_xxxxx_xxxxx",
    "bookingId": "booking-id-here"
  }'
```

### 6. Test Webhook (Optional)

To test webhooks locally, use a tool like:
- **ngrok**: `ngrok http 3000`
- **Paystack Webhook Testing**: Use Paystack dashboard webhook tester

1. Get your webhook URL: `https://your-ngrok-url.ngrok.io/api/payments/webhook`
2. Add it to Paystack Dashboard → Settings → API Keys & Webhooks
3. Test webhook from Paystack dashboard

## Common Issues & Solutions

### Issue 1: "PAYSTACK_SECRET_KEY is not set"
**Solution**: Add `PAYSTACK_SECRET_KEY` to `.env.local`

### Issue 2: "Payment initialization failed"
**Check**:
- Paystack secret key is correct
- Booking exists and is in PENDING status
- Currency column exists in database (run migration if needed)

### Issue 3: "Invalid payment URL"
**Solution**: Check that Paystack returned `authorization_url` in response

### Issue 4: Payment succeeds but booking not updated
**Check**:
- Webhook is configured correctly
- Payment verification route is working
- Check database for payment status

## Testing Checklist

- [ ] Payment initialization works
- [ ] Redirect to Paystack checkout works
- [ ] Test card payment succeeds
- [ ] Payment callback works
- [ ] Booking status updates to CONFIRMED
- [ ] Payment status updates to PAID
- [ ] Success notification is created
- [ ] Video session is created (for online lessons)
- [ ] Error handling works (test with failing card)
- [ ] Webhook receives events (if configured)

## Debugging

### Enable Debug Logging

Check server console for:
- `Initializing Paystack transaction with options: {...}`
- `Paystack response: {...}`
- `Payment initialization error: {...}`

### Check Database

Query payments table:
```sql
SELECT * FROM payments WHERE bookingId = 'your-booking-id';
```

Query bookings table:
```sql
SELECT * FROM bookings WHERE id = 'your-booking-id';
```

## Next Steps

1. Test with real Paystack account (production mode)
2. Configure webhook URL in production
3. Set up split payments if needed
4. Test mobile money payments (Ghana)
5. Test bank transfer payments
