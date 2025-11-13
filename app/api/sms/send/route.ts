import { NextResponse } from 'next/server'
import { z } from 'zod'
import { sendSMS } from '@/lib/sms'

const sendSMSSchema = z.object({
  to: z.string().min(1, 'Phone number is required'),
  message: z.string().min(1, 'Message is required'),
  code: z.string().optional(),
})

/**
 * Built-in SMS API endpoint
 * POST /api/sms/send
 * 
 * Body: {
 *   to: string (phone number with country code)
 *   message: string
 *   code?: string (optional verification code)
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { to, message, code } = sendSMSSchema.parse(body)

    // Send SMS using the shared utility
    const result = await sendSMS(to, message, code)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'SMS sent successfully',
        to: to.startsWith('+') ? to : `+${to}`,
        provider: result.provider,
        messageId: result.messageId,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to send SMS',
          provider: result.provider,
          fallback: 'Check console logs for code',
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('SMS send error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to check SMS configuration status
export async function GET() {
  const smsProvider = process.env.SMS_PROVIDER || 'console'
  const isConfigured =
    smsProvider === 'console' ||
    (smsProvider === 'api' &&
      process.env.SMS_API_URL &&
      process.env.SMS_API_KEY) ||
    (smsProvider === 'aws' &&
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY) ||
    (smsProvider === 'vonage' &&
      process.env.VONAGE_API_KEY &&
      process.env.VONAGE_API_SECRET)

  return NextResponse.json({
    provider: smsProvider,
    configured: isConfigured,
    mode: process.env.NODE_ENV === 'development' ? 'development' : 'production',
  })
}

