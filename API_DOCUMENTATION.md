# API Documentation

## SMS API

### Send SMS
**Endpoint:** `POST /api/sms/send`

Send an SMS message using the configured SMS provider.

**Request Body:**
```json
{
  "to": "+1234567890",
  "message": "Your message here",
  "code": "123456" // optional
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "SMS sent successfully",
  "to": "+1234567890",
  "provider": "console",
  "messageId": "msg-123"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Failed to send SMS",
  "provider": "api",
  "fallback": "Check console logs for code"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/sms/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+1234567890",
    "message": "Your verification code is: 123456",
    "code": "123456"
  }'
```

---

### Check SMS Configuration
**Endpoint:** `GET /api/sms/send`

Check the current SMS provider configuration.

**Response:**
```json
{
  "provider": "console",
  "configured": true,
  "mode": "development"
}
```

---

### Test SMS (Admin Only)
**Endpoint:** `POST /api/sms/test`

Test SMS functionality. Requires admin authentication or development mode.

**Request Body:**
```json
{
  "phoneNumber": "+1234567890",
  "message": "Optional custom message" // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test SMS sent successfully",
  "phoneNumber": "+1234567890",
  "testCode": "123456",
  "provider": "console",
  "note": "Check console logs for the code (development mode)"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/sms/test \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{
    "phoneNumber": "+1234567890"
  }'
```

---

## SMS Provider Configuration

### Console Mode (Default)
No configuration needed. SMS messages are logged to the console.

```env
SMS_PROVIDER=console
```

### Custom HTTP API
Use any SMS service with an HTTP API.

```env
SMS_PROVIDER=api
SMS_API_URL=https://your-sms-service.com/api/send
SMS_API_KEY=your-api-key

# Optional: Custom headers
SMS_API_HEADERS={"X-Custom-Header": "value"}

# Optional: Extra data to send
SMS_API_EXTRA_DATA={"customField": "value"}
```

### AWS SNS
Use AWS Simple Notification Service.

```env
SMS_PROVIDER=aws
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

### Vonage (Nexmo)
Use Vonage SMS service.

```env
SMS_PROVIDER=vonage
VONAGE_API_KEY=your-api-key
VONAGE_API_SECRET=your-api-secret
VONAGE_FROM_NUMBER=TutorMe
```

---

## Usage in Code

### Using the SMS Utility

```typescript
import { sendSMS } from '@/lib/sms'

const result = await sendSMS(
  '+1234567890',
  'Your verification code is: 123456',
  '123456'
)

if (result.success) {
  console.log(`SMS sent via ${result.provider}`)
} else {
  console.error(`Failed: ${result.error}`)
}
```

### Using the API Endpoint

```typescript
const response = await fetch('/api/sms/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: '+1234567890',
    message: 'Your verification code is: 123456',
    code: '123456'
  })
})

const result = await response.json()
```

---

## Error Handling

All SMS functions gracefully handle errors and fall back to console logging if SMS sending fails. This ensures the application continues to work even if SMS services are unavailable.

Errors are logged to the console with detailed information for debugging.

