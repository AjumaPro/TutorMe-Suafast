# Email Configuration for Two-Factor Authentication

The email-based 2FA feature requires SMTP configuration to send verification codes via email.

## Current Status

Currently, email 2FA is **partially working**:
- ✅ OTP codes are generated and stored in the database
- ✅ Codes expire after 10 minutes
- ✅ Verification works correctly
- ⚠️ **Email sending is not configured** - codes are logged to console instead

## Setup Instructions

### Option 1: Gmail SMTP (Recommended for Development)

1. **Enable App Passwords in Gmail:**
   - Go to your Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate an app password for "Mail"

2. **Add to your `.env` file:**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   SMTP_FROM=noreply@tutorme.com
   ```

### Option 2: SendGrid (Recommended for Production)

1. **Sign up for SendGrid** (free tier: 100 emails/day)

2. **Create an API Key:**
   - Settings → API Keys → Create API Key

3. **Add to your `.env` file:**
   ```env
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASSWORD=your-sendgrid-api-key
   SMTP_FROM=noreply@yourdomain.com
   ```

### Option 3: AWS SES

1. **Set up AWS SES** and verify your email/domain

2. **Add to your `.env` file:**
   ```env
   SMTP_HOST=email-smtp.us-east-1.amazonaws.com
   SMTP_PORT=587
   SMTP_USER=your-aws-ses-smtp-username
   SMTP_PASSWORD=your-aws-ses-smtp-password
   SMTP_FROM=noreply@yourdomain.com
   ```

### Option 4: Other SMTP Services

Any SMTP service will work. Just configure:
```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587 (or 465 for SSL)
SMTP_USER=your-username
SMTP_PASSWORD=your-password
SMTP_FROM=noreply@yourdomain.com
```

## Testing

1. **Without SMTP configured:**
   - Codes are logged to the console
   - Check your terminal/server logs for the OTP code
   - Format: `📧 Email OTP for user@example.com: 123456`

2. **With SMTP configured:**
   - Codes are sent via email
   - Check the recipient's inbox
   - Email includes a nicely formatted HTML template

## Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `SMTP_HOST` | Yes* | SMTP server hostname | `smtp.gmail.com` |
| `SMTP_PORT` | Yes* | SMTP server port | `587` or `465` |
| `SMTP_USER` | Yes* | SMTP username | `your-email@gmail.com` |
| `SMTP_PASSWORD` | Yes* | SMTP password/app password | `your-password` |
| `SMTP_FROM` | No | From email address | `noreply@tutorme.com` |

*Required only if you want actual email sending. Without these, codes are logged to console.

## Security Notes

- Never commit `.env` files to version control
- Use app passwords, not your main account password
- In production, use a dedicated email service (SendGrid, AWS SES, etc.)
- Consider rate limiting to prevent abuse

## Troubleshooting

**Emails not sending:**
1. Check that all SMTP environment variables are set
2. Verify SMTP credentials are correct
3. Check firewall/network settings
4. For Gmail, ensure "Less secure app access" is enabled OR use App Passwords
5. Check server logs for error messages

**Codes not received:**
1. Check spam/junk folder
2. Verify email address is correct
3. Check console logs if SMTP is not configured
4. Verify code hasn't expired (10 minutes)

