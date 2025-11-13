# Tutor Management Features

## Overview
This document describes the new tutor management features that allow admins to remove tutors and toggle their active/inactive status.

## Features

### 1. Remove/Delete Tutors
- **Endpoint**: `DELETE /api/admin/tutors/[id]/delete`
- **Access**: Admin only
- **Functionality**:
  - Permanently removes a tutor from the system
  - Checks for active bookings (PENDING or CONFIRMED) before deletion
  - Prevents deletion if tutor has active bookings
  - Deletes tutor profile (cascades to related records via foreign keys)
  - User account remains (can be deleted separately if needed)

### 2. Toggle Active/Inactive Status
- **Endpoint**: `POST /api/admin/tutors/[id]/status`
- **Access**: Admin only
- **Functionality**:
  - Toggles tutor's `isActive` status
  - Inactive tutors are hidden from public listings
  - Admins can still see inactive tutors in the admin panel
  - Useful for temporarily disabling tutors without deleting them

## Database Changes

### New Column: `isActive`
- **Table**: `tutor_profiles`
- **Type**: `BOOLEAN`
- **Default**: `true`
- **Migration Script**: `supabase/add-isactive-to-tutors.sql`

To apply the migration:
1. Go to Supabase Dashboard → SQL Editor
2. Run the script: `supabase/add-isactive-to-tutors.sql`

## UI Changes

### Admin Panel (`/admin?tab=tutors`)
- **Pending Tutors**: Show "Approve" and "Reject" buttons
- **Approved Tutors**: Show:
  - **Active/Inactive Badge**: Blue badge for "Active", gray badge for "Inactive"
  - **Activate/Deactivate Button**: Toggle tutor's active status
  - **Remove Button**: Permanently delete tutor (with confirmation)

### Public Listings
- **Tutors Page** (`/tutors`): Only shows approved AND active tutors
- **Search Page** (`/search`): Only shows approved AND active tutors
- **Admin View**: Admins can see all tutors regardless of status

## API Endpoints

### 1. Delete Tutor
```typescript
DELETE /api/admin/tutors/[id]/delete

Response (200):
{
  "message": "Tutor removed successfully"
}

Response (400):
{
  "error": "Cannot delete tutor with active bookings...",
  "hasActiveBookings": true
}
```

### 2. Toggle Status
```typescript
POST /api/admin/tutors/[id]/status
Body: {
  "isActive": boolean
}

Response (200):
{
  "message": "Tutor activated successfully",
  "tutor": { ... }
}
```

## Usage Flow

### Deactivating a Tutor
1. Admin navigates to `/admin?tab=tutors`
2. Finds the approved tutor
3. Clicks "Deactivate" button
4. Confirms the action
5. Tutor becomes inactive and is hidden from public listings

### Removing a Tutor
1. Admin navigates to `/admin?tab=tutors`
2. Finds the approved tutor
3. Clicks "Remove" button
4. Confirms the action
5. System checks for active bookings
6. If no active bookings, tutor is permanently deleted
7. If active bookings exist, deletion is prevented with an error message

## Security
- All endpoints require admin authentication
- Active booking check prevents accidental data loss
- Confirmation dialogs prevent accidental actions
- Foreign key constraints ensure data integrity

## Notes
- Inactive tutors can still be reactivated
- Deleted tutors cannot be recovered
- User accounts remain after tutor profile deletion (can be deleted separately)
- The `isActive` column defaults to `true` for backward compatibility

