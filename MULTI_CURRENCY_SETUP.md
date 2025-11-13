# Multi-Currency Support Setup

Suafast now supports multiple currencies with **Ghana Cedis (GHS)** as the default currency.

## Overview

- **Default Currency**: Ghana Cedis (₵) - GHS
- **Supported Currencies**: GHS, USD, EUR, GBP, NGN, KES, ZAR
- **Multi-Currency**: Tutors can set their preferred currency
- **Automatic Conversion**: Payment processing handles currency conversion for payment gateways

## Database Changes

Run the SQL migration to add currency support:

```sql
-- Run this in Supabase SQL Editor
-- File: supabase/add-currency-support.sql
```

This adds:
- `currency` column to `tutor_profiles` (default: 'GHS')
- `currency` column to `bookings` (default: 'GHS')
- `currency` column to `payments` (default: 'GHS')

## Supported Currencies

| Code | Name | Symbol | Locale |
|------|------|--------|--------|
| GHS | Ghana Cedis | ₵ | en-GH |
| USD | US Dollars | $ | en-US |
| EUR | Euros | € | en-GB |
| GBP | British Pounds | £ | en-GB |
| NGN | Nigerian Naira | ₦ | en-NG |
| KES | Kenyan Shillings | KSh | en-KE |
| ZAR | South African Rand | R | en-ZA |

## Usage

### Format Currency in Components

```typescript
import { formatCurrency, parseCurrencyCode } from '@/lib/currency'

// Format with default currency (GHS)
formatCurrency(100.50) // "₵100.50"

// Format with specific currency
formatCurrency(100.50, 'USD') // "$100.50"
formatCurrency(100.50, 'EUR') // "€100.50"

// Parse currency from booking/tutor
const currency = parseCurrencyCode(booking.currency) // Returns CurrencyCode
formatCurrency(booking.price, currency)
```

### Payment Processing

The payment initialization automatically:
1. Gets currency from booking (or tutor profile)
2. Converts amount to smallest unit (pesewas for GHS, cents for USD, etc.)
3. Sends to Paystack with correct currency

```typescript
// In app/api/payments/initialize/route.ts
const currency = parseCurrencyCode(booking.currency || tutor?.currency)
const amountInSmallestUnit = toSmallestUnit(totalAmount, currency)
```

### Currency Selector Component

Use the `CurrencySelector` component for currency selection:

```tsx
import CurrencySelector from '@/components/CurrencySelector'

<CurrencySelector
  value={selectedCurrency}
  onChange={(currency) => setSelectedCurrency(currency)}
/>
```

## Setting Tutor Currency

Tutors can set their preferred currency in their profile. When creating a booking:
1. Currency is inherited from tutor profile
2. If tutor doesn't have currency set, defaults to GHS
3. Booking stores the currency for payment processing

## Payment Gateway Support

### Paystack

Paystack supports multiple currencies:
- **GHS** (Ghana Cedis) - Primary
- **NGN** (Nigerian Naira)
- **ZAR** (South African Rand)
- **KES** (Kenyan Shillings)
- **USD** (US Dollars)

For currencies not directly supported by Paystack, you may need to:
1. Convert to supported currency
2. Use a different payment gateway
3. Handle conversion manually

## Testing

1. **Seed test data** (all tutors use GHS by default):
   ```bash
   npm run seed:supabase
   ```

2. **Test currency formatting**:
   - Check tutor profiles show correct currency
   - Verify booking prices display with correct symbol
   - Test payment flow with different currencies

3. **Update tutor currency** (in Supabase or via API):
   ```sql
   UPDATE tutor_profiles SET currency = 'USD' WHERE id = 'tutor_id';
   ```

## Future Enhancements

- Currency conversion rates API integration
- Multi-currency wallet support
- Automatic currency conversion for international tutors
- Currency preference in user settings
- Real-time exchange rate display

## Files Modified

- ✅ `lib/currency.ts` - Currency utilities and configuration
- ✅ `app/api/payments/initialize/route.ts` - Multi-currency payment processing
- ✅ `app/api/bookings/route.ts` - Currency inheritance from tutor
- ✅ `components/PaymentForm.tsx` - Currency-aware price display
- ✅ `app/lessons/page.tsx` - Currency formatting
- ✅ `app/lessons/[id]/page.tsx` - Currency formatting
- ✅ `scripts/seed-test-data-supabase.js` - GHS default for test data
- ✅ `components/CurrencySelector.tsx` - Currency selection component
- ✅ `supabase/add-currency-support.sql` - Database migration

## Notes

- All existing records default to GHS
- Currency is stored as TEXT in database (ISO 4217 codes)
- Payment amounts are converted to smallest unit for processing
- UI automatically formats based on currency code
- Default currency can be changed in `lib/currency.ts`

