# Paystack Checkout Page Configuration Guide

This guide explains how to customize the Paystack checkout page for TutorMe.

## Overview

The Paystack checkout page can be customized through the configuration file at `lib/paystack-config.ts`. This allows you to:

- Control which payment methods are displayed
- Add your branding (logo)
- Configure split payments for tutors
- Set up fee structures

## Configuration File

Edit `lib/paystack-config.ts` to customize checkout behavior:

```typescript
export const paystackConfig = {
  logo: process.env.NEXT_PUBLIC_PAYSTACK_LOGO_URL || '',
  channels: ['card', 'bank', 'mobile_money', ...],
  splitCode: process.env.PAYSTACK_SPLIT_CODE || '',
  // ... other options
}
```

## Payment Channels

Control which payment methods customers can use:

### Available Channels

- **`card`**: Credit/debit card payments (Visa, Mastercard, Verve)
- **`bank`**: Bank account payments
- **`ussd`**: USSD payments (mobile banking codes like *737#)
- **`qr`**: QR code payments
- **`mobile_money`**: Mobile money wallets (MTN, Vodafone, AirtelTigo in Ghana)
- **`bank_transfer`**: Direct bank transfers

### Example: Show Only Cards and Mobile Money

```typescript
channels: [
  'card',
  'mobile_money',
]
```

## Adding Your Logo

1. Upload your logo to a publicly accessible HTTPS URL
   - Recommended size: 200x50px
   - Format: PNG with transparent background
   - Example: `https://yourdomain.com/images/logo.png`

2. Add to your `.env` file:
   ```
   NEXT_PUBLIC_PAYSTACK_LOGO_URL=https://yourdomain.com/images/logo.png
   ```

3. The logo will appear on the Paystack checkout page

## Split Payments

If you want to automatically split payments between the platform and tutors:

### Setup in Paystack Dashboard

1. Go to **Settings** > **Subaccounts** in Paystack dashboard
2. Create subaccounts for each tutor (or use dynamic subaccounts)
3. Create a split payment plan
4. Copy the split code (format: `SPLIT_xxxxxxxxxxxxx`)

### Configure in TutorMe

1. Add split code to `.env`:
   ```
   PAYSTACK_SPLIT_CODE=SPLIT_xxxxxxxxxxxxx
   ```

2. The split code will be automatically applied to all transactions

### Split Payment Structure

- **Platform Fee**: 15% (configured in `app/api/payments/initialize/route.ts`)
- **Tutor Payout**: 85% (automatically calculated)

## Fee Bearer Configuration

Control who pays Paystack transaction fees:

- **`account`** (default): Platform pays all fees
- **`subaccount`**: Tutor's subaccount pays fees

To change:
```typescript
bearer: 'subaccount', // Tutors pay fees
```

## Advanced Customization

### Using Paystack Payment Pages

For more advanced customization (custom colors, full branding), consider using Paystack Payment Pages:

1. Create a Payment Page in Paystack dashboard
2. Customize appearance, colors, and messaging
3. Use the Payment Page link instead of inline checkout

### Custom Metadata

Additional booking information is automatically included in transaction metadata:

- Booking ID
- Payment ID
- Student name
- Tutor name
- Subject
- Lesson type
- Scheduled date/time
- Duration

This metadata is useful for:
- Transaction tracking
- Customer support
- Analytics
- Reconciliation

## Testing

### Test Cards (Ghana)

Use these test cards in Paystack test mode:

- **Success**: `4084084084084081`
- **Decline**: `5060666666666666666`
- **Insufficient Funds**: `5060666666666666667`

### Test Mobile Money

- **MTN**: Use any phone number starting with `024`
- **Vodafone**: Use any phone number starting with `020`
- **AirtelTigo**: Use any phone number starting with `027`

## Production Checklist

Before going live:

- [ ] Switch to live API keys in `.env`
- [ ] Configure webhook URL in Paystack dashboard
- [ ] Test all payment channels
- [ ] Verify split payments (if enabled)
- [ ] Add your logo URL
- [ ] Test with real payment methods
- [ ] Set up transaction monitoring
- [ ] Configure email notifications in Paystack

## Troubleshooting

### Logo Not Showing

- Ensure logo URL is HTTPS (not HTTP)
- Check that logo is publicly accessible
- Verify image format (PNG recommended)
- Check browser console for CORS errors

### Payment Channel Not Available

- Verify channel is supported in your country
- Check Paystack account settings
- Ensure channel is enabled in Paystack dashboard

### Split Payments Not Working

- Verify split code is correct
- Check subaccount status in Paystack
- Ensure split plan is active
- Review Paystack transaction logs

## Support

For Paystack-specific issues:
- [Paystack Documentation](https://paystack.com/docs)
- [Paystack Support](https://paystack.com/contact)

For TutorMe integration issues:
- Check `lib/paystack-config.ts` configuration
- Review API logs in `app/api/payments/`
- Check webhook logs in Paystack dashboard

