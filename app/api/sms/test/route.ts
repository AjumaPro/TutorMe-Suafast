import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendSMS } from '@/lib/sms'
import { z } from 'zod'

const testSMSSchema = z.object({
  phoneNumber: z.string().min(1, 'Phone number is required'),
  message: z.string().optional(),
})

/**
 * Test endpoint for SMS functionality (requires authentication)
 * POST /api/sms/test
 * 
 * Only available to admins or in development mode
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only allow admins or in development
    if (session.user.role !== 'ADMIN' && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required in production' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { phoneNumber, message } = testSMSSchema.parse(body)

    // Generate a test code
    const testCode = Math.floor(100000 + Math.random() * 900000).toString()
    const testMessage = message || `Your TutorMe test verification code is: ${testCode}. This is a test message.`

    // Send SMS
    const result = await sendSMS(phoneNumber, testMessage, testCode)

    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Test SMS sent successfully' : 'Failed to send test SMS',
      phoneNumber: phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`,
      testCode: testCode,
      provider: result.provider,
      messageId: result.messageId,
      error: result.error,
      note: result.provider === 'console' 
        ? 'Check console logs for the code (development mode)'
        : 'Check your phone for the SMS',
    })
  } catch (error) {
    console.error('Test SMS error:', error)
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

