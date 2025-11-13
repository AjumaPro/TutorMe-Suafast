# SMS Configuration for Two-Factor Authentication

The SMS-based 2FA feature supports multiple SMS providers or can use a simple HTTP API endpoint.

## Current Status

Currently, SMS 2FA is **working**:
- ✅ OTP codes are generated and stored in the database
- ✅ Codes expire after 10 minutes
- ✅ Verification works correctly
- ⚠️ **SMS sending** - Configurable via environment variables

## Setup Options

### Option 1: Development Mode (Console Logging) - Default

No configuration needed! Codes are logged to the console for development.

```env
# No configuration needed - uses console logging by default
SMS_PROVIDER=console
```

### Option 2: Custom HTTP API (Recommended - Most Flexible)

Use any SMS service that provides an HTTP API endpoint.

```env
SMS_PROVIDER=api
SMS_API_URL=https://your-sms-service.com/api/send
SMS_API_KEY=your-api-key
```

**API Request Format:**
Your API endpoint should accept POST requests with this format:
```json
{
  "to": "+1234567890",
  "message": "Your TutorMe verification code is: 123456. This code expires in 10 minutes.",
  "code": "123456"
}
```

**Example Services:**
- **MessageBird**: `https://rest.messagebird.com/messages`
- **Plivo**: `https://api.plivo.com/v1/Account/{auth_id}/Message/`
- **Any custom SMS gateway**

### Option 3: AWS SNS (If using AWS)

If you're already using AWS, SNS is a great built-in option.

```env
SMS_PROVIDER=aws
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

**Setup:**
1. Create an IAM user with SNS publish permissions
2. Get access keys from AWS IAM
3. Set environment variables

### Option 4: Vonage (Nexmo)

Simple SMS service with good global coverage.

```env
SMS_PROVIDER=vonage
VONAGE_API_KEY=your-api-key
VONAGE_API_SECRET=your-api-secret
VONAGE_FROM_NUMBER=TutorMe
```

**Setup:**
1. Sign up at https://www.vonage.com/
2. Get API key and secret from dashboard
3. Set environment variables

## Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `SMS_PROVIDER` | No | Provider type: `console`, `api`, `aws`, `vonage` | `api` |
| `SMS_API_URL` | Yes* | Custom API endpoint URL | `https://api.example.com/sms` |
| `SMS_API_KEY` | Yes* | API authentication key | `your-api-key` |
| `AWS_REGION` | Yes** | AWS region for SNS | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | Yes** | AWS access key | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | Yes** | AWS secret key | `secret...` |
| `VONAGE_API_KEY` | Yes*** | Vonage API key | `abc123...` |
| `VONAGE_API_SECRET` | Yes*** | Vonage API secret | `secret...` |
| `VONAGE_FROM_NUMBER` | No | Sender name/number | `TutorMe` |

*Required only if `SMS_PROVIDER=api`
**Required only if `SMS_PROVIDER=aws`
***Required only if `SMS_PROVIDER=vonage`

## Phone Number Format

- Phone numbers should include country code
- Format: `+[country code][number]`
- Examples:
  - US: `+1234567890`
  - UK: `+441234567890`
  - Ghana: `+233123456789`

The system will automatically add `+` if missing.

## Requirements for SMS 2FA

1. **User must have a phone number** in their profile
2. **Phone number must be added** before enabling SMS 2FA
3. Users can add/update phone number in Settings → Profile Settings

## Testing

1. **Development Mode (Default):**
   - Codes are logged to the console
   - Check your terminal/server logs for the OTP code
   - Format: `📱 SMS OTP for +1234567890: 123456`

2. **Production Mode:**
   - Codes are sent via configured SMS provider
   - Check the recipient's phone for the verification code
   - Message format: "Your TutorMe verification code is: 123456. This code expires in 10 minutes."

## Security Notes

- Never commit `.env` files to version control
- Keep API keys and credentials secure
- Consider rate limiting to prevent abuse
- Monitor SMS costs (most services charge per message)

## Troubleshooting

**SMS not sending:**
1. Check that `SMS_PROVIDER` is set correctly
2. Verify all required environment variables are set
3. Check API credentials are correct
4. Verify phone number format is correct (must include country code)
5. Check server logs for error messages
6. For API provider, verify your endpoint accepts the expected format

**Codes not received:**
1. Check spam/junk folder (some carriers filter SMS)
2. Verify phone number is correct
3. Check console logs if using development mode
4. Verify code hasn't expired (10 minutes)
5. Check provider logs/dashboard for delivery status

## Cost Considerations

- Most SMS services charge per message sent
- Development mode (console) is free
- Consider implementing rate limiting to control costs
- Monitor usage through provider dashboards

## Recommended Providers

**For Simple Setup:**
- Custom HTTP API (most flexible)
- AWS SNS (if already using AWS)

**For Global Coverage:**
- Vonage (good international support)
- MessageBird (good API)

**For Development:**
- Console mode (default, free, no setup)
