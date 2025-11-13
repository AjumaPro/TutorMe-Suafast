# Currency Configuration - Ghana Cedis (GHS) Default

Suafast uses **Ghana Cedis (GHS)** as the default currency, with support for multiple currencies.

## Default Currency

- **Primary Currency**: Ghana Cedis (₵) - GHS
- **Default for all new records**: GHS
- **Payment Gateway**: Paystack (supports GHS and other African currencies)

## Supported Currencies

| Code | Name | Symbol | Locale | Smallest Unit |
|------|------|--------|--------|---------------|
| **GHS** | Ghana Cedis | ₵ | en-GH | Pesewas (100) |
| USD | US Dollars | $ | en-US | Cents (100) |
| EUR | Euros | € | en-GB | Cents (100) |
| GBP | British Pounds | £ | en-GB | Pence (100) |
| NGN | Nigerian Naira | ₦ | en-NG | Kobo (100) |
| KES | Kenyan Shillings | KSh | en-KE | Cents (100) |
| ZAR | South African Rand | R | en-ZA | Cents (100) |

## Database Schema

All currency columns default to `'GHS'`:

```sql
-- tutor_profiles table
currency TEXT NOT NULL DEFAULT 'GHS'

-- bookings table
currency TEXT NOT NULL DEFAULT 'GHS'

-- payments table
currency TEXT NOT NULL DEFAULT 'GHS'
```

## Implementation

### 1. Currency Utility Functions

Located in `lib/currency.ts`:

```typescript
import { formatCurrency, parseCurrencyCode, DEFAULT_CURRENCY } from '@/lib/currency'

// Format amount with currency symbol
formatCurrency(100.50) // "₵100.50" (defaults to GHS)
formatCurrency(100.50, 'USD') // "$100.50"

// Parse currency code (defaults to GHS if invalid)
const currency = parseCurrencyCode(booking.currency) // Returns CurrencyCode
```

### 2. Payment Processing

Payments automatically:
1. Get currency from booking (or tutor profile)
2. Default to GHS if not specified
3. Convert to smallest unit (pesewas for GHS)
4. Send to Paystack with correct currency

```typescript
// In app/api/payments/initialize/route.ts
const currency = parseCurrencyCode(booking.currency || tutor?.currency || DEFAULT_CURRENCY)
const amountInSmallestUnit = toSmallestUnit(totalAmount, currency)
```

### 3. Displaying Prices

Always use `formatCurrency()` instead of hardcoded `$`:

```typescript
// ❌ Wrong
<p>${booking.price.toFixed(2)}</p>

// ✅ Correct
<p>{formatCurrency(booking.price, parseCurrencyCode(booking.currency))}</p>
```

### 4. Tutor Profile Currency

Tutors can set their preferred currency in their profile:
- Default: GHS
- Can be changed to any supported currency
- Bookings inherit tutor's currency

## Migration

If you have an existing database, run the migration:

```sql
-- File: supabase/add-currency-support.sql
-- This adds currency columns with GHS default to existing tables
```

Or use the main schema which already includes currency columns:

```sql
-- File: supabase/schema.sql
-- Already includes currency columns with GHS default
```

## Paystack Configuration

Paystack supports multiple currencies:
- **GHS** (Ghana Cedis) - Primary
- **NGN** (Nigerian Naira)
- **ZAR** (South African Rand)
- **KES** (Kenyan Shillings)
- **USD** (US Dollars)

The payment initialization automatically uses the booking's currency.

## Testing

1. **Default Currency Test**:
   - Create a new tutor profile → Should default to GHS
   - Create a booking → Should use tutor's currency (GHS by default)
   - Make payment → Should process in GHS

2. **Multi-Currency Test**:
   - Update tutor profile to USD
   - Create booking → Should use USD
   - Make payment → Should process in USD

3. **Display Test**:
   - Check all price displays use `formatCurrency()`
   - Verify currency symbol shows correctly (₵ for GHS, $ for USD, etc.)

## Files Updated

- ✅ `supabase/schema.sql` - Added currency columns with GHS default
- ✅ `lib/currency.ts` - Currency utilities (already exists)
- ✅ `app/api/payments/initialize/route.ts` - Uses currency from booking
- ✅ `app/api/bookings/route.ts` - Sets currency from tutor profile
- ✅ `app/lessons/page.tsx` - Uses formatCurrency()
- ✅ `app/lessons/[id]/page.tsx` - Uses formatCurrency()
- ✅ `components/PaymentForm.tsx` - Uses formatCurrency()

## Notes

- All new records default to GHS
- Existing records without currency will use GHS
- Currency is inherited from tutor profile to bookings
- Payments use the booking's currency
- Paystack handles currency conversion if needed

🎉 **GHS is now the default currency with full multi-currency support!**

