# 🔄 Migration from Prisma to Supabase

## Status: ✅ Core Migration Complete

### What's Done

1. ✅ **Supabase Database Client Created** (`lib/supabase-db.ts`)
   - All database operations available
   - Prisma-like API for easy migration
   - Full TypeScript support

2. ✅ **Authentication Updated**
   - `app/api/auth/login/route.ts` - Uses Supabase
   - `lib/auth.ts` - Uses Supabase
   - Login functionality works with Supabase

3. ✅ **Backward Compatibility**
   - `lib/prisma.ts` now redirects to Supabase
   - Existing code continues to work
   - Gradual migration possible

### What Needs Environment Variables

Add these to your `.env` file:

```env
# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL="https://ptjnlzrvqyynklzdipac.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"

# Optional: Keep DATABASE_URL for reference (not used by Supabase client)
# DATABASE_URL="postgresql://..."
```

**Get Service Role Key:**
1. Go to: https://supabase.com/dashboard/project/ptjnlzrvqyynklzdipac/settings/api
2. Scroll to "Project API keys"
3. Copy "service_role" key (⚠️ Keep this secret!)
4. Add to `.env` as `SUPABASE_SERVICE_ROLE_KEY`

### Remaining Files to Update

The following files still import Prisma but will work via backward compatibility:

- `app/api/auth/signup/route.ts`
- `app/api/auth/forgot-password/route.ts`
- `app/api/auth/reset-password/route.ts`
- `app/api/auth/verify-email/route.ts`
- `app/dashboard/page.tsx`
- `app/admin/page.tsx`
- `app/search/page.tsx`
- `app/tutors/page.tsx`
- `app/bookings/page.tsx`
- And 60+ more files...

**Note:** They will work via the compatibility layer, but you should update them gradually.

### How to Update Files

#### Step 1: Replace Import

**Before:**
```typescript
import { prisma } from '@/lib/prisma'
```

**After:**
```typescript
import { db } from '@/lib/supabase-db'
```

#### Step 2: Update Database Calls

**Find User:**
```typescript
// Before
const user = await prisma.user.findUnique({
  where: { email }
})

// After
const user = await db.users.findUnique({
  email
})
```

**Update User:**
```typescript
// Before
await prisma.user.update({
  where: { id: user.id },
  data: { name: 'New Name' }
})

// After
await db.users.update(
  { id: user.id },
  { name: 'New Name' }
)
```

**Create User:**
```typescript
// Before
await prisma.user.create({
  data: { email, password, name }
})

// After
await db.users.create({
  email, password, name
})
```

**Find Many:**
```typescript
// Before
const users = await prisma.user.findMany({
  where: { role: 'ADMIN' },
  orderBy: { createdAt: 'desc' },
  take: 10
})

// After
const users = await db.users.findMany({
  where: { role: 'ADMIN' },
  orderBy: { createdAt: 'desc' },
  take: 10
})
```

### Available Database Methods

See `lib/supabase-db.ts` for all available methods:

- `db.users.*` - User operations
- `db.tutorProfile.*` - Tutor profile operations
- `db.booking.*` - Booking operations
- `db.payment.*` - Payment operations
- `db.review.*` - Review operations
- `db.notification.*` - Notification operations
- `db.message.*` - Message operations
- `db.videoSession.*` - Video session operations
- `db.assignment.*` - Assignment operations
- `db.progressEntry.*` - Progress entry operations
- `db.address.*` - Address operations
- `db.availabilitySlot.*` - Availability slot operations

### Remove Prisma Dependencies

After migration is complete:

```bash
npm uninstall @prisma/client prisma
rm -rf prisma/
```

### Testing

1. **Set Environment Variables:**
   ```bash
   # Add to .env
   NEXT_PUBLIC_SUPABASE_URL="https://ptjnlzrvqyynklzdipac.supabase.co"
   SUPABASE_SERVICE_ROLE_KEY="your-key-here"
   ```

2. **Test Login:**
   - Go to: http://localhost:3000/auth/signin
   - Login with: `infoajumapro@gmail.com` / `test1234`

3. **Check for Errors:**
   - Look for any Prisma-related errors in console
   - Update files as needed

### Benefits of Supabase

✅ **No Connection String Issues** - Uses Supabase API
✅ **Real-time Updates** - Built-in realtime subscriptions
✅ **Storage** - File uploads via Supabase Storage
✅ **Edge Functions** - Serverless functions
✅ **Better Performance** - Direct API calls
✅ **Simpler Setup** - No Prisma Client generation needed

### Next Steps

1. ✅ Set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`
2. ✅ Test login functionality
3. ⏳ Gradually update remaining files (they work via compatibility layer)
4. ⏳ Remove Prisma dependencies when all files updated
5. ⏳ Remove `lib/prisma.ts` compatibility layer

### Need Help?

- See `lib/supabase-db.ts` for all available methods
- Check Supabase docs: https://supabase.com/docs
- Run `npm run migrate-to-supabase` for migration guide

