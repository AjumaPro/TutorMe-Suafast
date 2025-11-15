# 🎓 Tutor Dashboard Features

## Overview

A comprehensive dashboard for tutors to manage their classes, view notifications, start class sessions, and track their performance.

## ✨ Features

### 1. **Tutor Dashboard** (`/tutor/dashboard`)
- **Statistics Overview**
  - Upcoming classes count
  - Total students
  - Total hours taught
  - Monthly earnings
  - Performance metrics

- **Class Management**
  - View all classes with filtering (All, Upcoming, Today, Pending, Completed)
  - See student details for each class
  - Start class sessions for online lessons
  - View class details and status

- **Today's Classes**
  - Quick view of today's scheduled classes
  - One-click access to start sessions
  - Real-time status updates

- **Notifications Panel**
  - Real-time notifications for:
    - New booking requests
    - Booking confirmations
    - Payment received
    - Reviews received
    - Messages
  - Mark as read functionality
  - Link to full notifications page

- **Quick Actions**
  - Update profile
  - View schedule
  - Access all lessons

### 2. **Email Notifications**
- **Automatic Email Alerts**
  - Sent when students book lessons
  - Includes booking details (subject, date, time, duration, price)
  - Professional HTML email template
  - Links to dashboard

- **Email Providers Supported**
  - Resend (recommended for production)
  - SMTP (nodemailer)
  - Console logging (development fallback)

### 3. **Class Session Management**
- **Start Class Sessions**
  - One-click start for online lessons
  - Available 15 minutes before scheduled time
  - Direct integration with video classroom
  - Session status tracking

- **Class Details**
  - Student information
  - Subject and duration
  - Lesson type (Online/In-Person)
  - Price and payment status
  - Notes and special instructions

### 4. **Notifications System**
- **In-App Notifications**
  - Real-time notification panel on dashboard
  - Unread count badge
  - Mark as read / Mark all as read
  - Click to view related content

- **Notification Types**
  - `BOOKING_CREATED` - New booking request
  - `BOOKING_CONFIRMED` - Booking confirmed
  - `PAYMENT_RECEIVED` - Payment received
  - `REVIEW_RECEIVED` - New review
  - `MESSAGE_RECEIVED` - New message

## 📁 File Structure

```
app/
  tutor/
    dashboard/
      page.tsx              # Main tutor dashboard page
components/
  TutorClassManagement.tsx  # Class management component
  TutorNotificationsPanel.tsx # Notifications panel component
lib/
  email.ts                  # Email sending utility
scripts/
  create-sample-tutors.js  # Script to create sample tutor accounts
```

## 🚀 Usage

### Accessing Tutor Dashboard

1. **Login as Tutor**
   - Navigate to `/auth/signin`
   - Login with tutor credentials

2. **Access Dashboard**
   - Click "Dashboard" in sidebar (automatically routes to `/tutor/dashboard` for tutors)
   - Or navigate directly to `/tutor/dashboard`

### Creating Sample Tutor Accounts

Run the script to create sample tutor accounts:

```bash
npm run seed:tutors
```

This creates 6 sample tutors with:
- Pre-configured profiles
- Auto-approved status
- Different subjects and grade levels
- Various hourly rates

**Sample Tutor Credentials:**
- Email: `sarah.johnson@tutorme.com` | Password: `Tutor123!`
- Email: `michael.chen@tutorme.com` | Password: `Tutor123!`
- Email: `emily.williams@tutorme.com` | Password: `Tutor123!`
- Email: `james.anderson@tutorme.com` | Password: `Tutor123!`
- Email: `lisa.martinez@tutorme.com` | Password: `Tutor123!`
- Email: `david.brown@tutorme.com` | Password: `Tutor123!`

### Email Configuration

To enable email notifications, set up one of the following:

**Option 1: Resend (Recommended)**
```env
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=TutorMe <noreply@yourdomain.com>
```

**Option 2: SMTP**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=TutorMe <noreply@yourdomain.com>
```

**Option 3: Development (Console Logging)**
- No configuration needed
- Emails will be logged to console

## 🎯 Features in Detail

### Class Management

The `TutorClassManagement` component provides:
- **Filtering**: Filter classes by status (All, Upcoming, Today, Pending, Completed)
- **Class Cards**: Each class shows:
  - Student name and email
  - Subject and duration
  - Date, time, and lesson type
  - Price
  - Status badge
  - Action buttons (Start Class, View Details)

### Notifications Panel

The `TutorNotificationsPanel` component provides:
- **Real-time Updates**: Shows latest notifications
- **Unread Badge**: Displays count of unread notifications
- **Quick Actions**: Mark as read, mark all as read
- **Smart Display**: Shows 5 most recent, expandable to all
- **Icons**: Different icons for different notification types
- **Time Formatting**: Human-readable time (e.g., "2h ago", "Just now")

### Email Notifications

When a student books a lesson:
1. **In-App Notification**: Created immediately
2. **Email Sent**: Professional HTML email with:
   - Booking details
   - Student information
   - Lesson schedule
   - Direct link to dashboard

## 🔧 Customization

### Adding New Notification Types

1. Update `lib/notifications.ts`:
```typescript
export type NotificationType =
  | 'BOOKING_CREATED'
  | 'YOUR_NEW_TYPE'  // Add here
```

2. Update `components/TutorNotificationsPanel.tsx`:
```typescript
const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'YOUR_NEW_TYPE':
      return <YourIcon className="h-5 w-5 text-color-500" />
    // ...
  }
}
```

### Customizing Email Template

Edit `lib/email.ts` - `sendBookingNotificationEmail` function to customize the HTML email template.

## 📊 Dashboard Statistics

The dashboard displays:
- **Upcoming Classes**: Count of confirmed/pending classes
- **Total Students**: Unique students count
- **Total Hours**: Sum of completed lesson durations
- **Monthly Earnings**: Earnings from paid bookings this month
- **Performance Metrics**: Completion rate, average rating, total reviews

## 🔐 Security

- Tutor dashboard is protected by authentication
- Only tutors can access `/tutor/dashboard`
- All API routes verify tutor role
- Email notifications only sent to verified tutor emails

## 🐛 Troubleshooting

### Email Not Sending
1. Check environment variables are set correctly
2. Verify email provider credentials
3. Check console logs for errors
4. In development, emails are logged to console

### Notifications Not Showing
1. Check database connection
2. Verify notifications table exists
3. Check user ID matches tutor profile

### Can't Start Class Session
1. Verify booking status is CONFIRMED
2. Check lesson type is ONLINE
3. Ensure session is within time window (15 min before to end time)

## 📝 Next Steps

Potential enhancements:
- [ ] Real-time notification updates (WebSocket)
- [ ] Email templates for other notification types
- [ ] Class recording functionality
- [ ] Advanced analytics and reporting
- [ ] Calendar integration
- [ ] Mobile app support

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review console logs
3. Verify database schema matches expected structure
4. Check environment variables

---

**Created**: Tutor Dashboard System
**Last Updated**: 2024
**Version**: 1.0.0

