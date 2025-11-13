import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-db'
import { generateTOTPSecret, generateEmailOTP, sendEmailOTP, generateSMSOTP, sendSMSOTP } from '@/lib/two-factor'
import { z } from 'zod'

const setupSchema = z.object({
  method: z.enum(['TOTP', 'EMAIL', 'SMS']),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { method } = setupSchema.parse(body)

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (method === 'TOTP') {
      // Generate TOTP secret and QR code
      const { secret, qrCodeUrl, manualEntryKey } = await generateTOTPSecret(
        user.email,
        'TutorMe'
      )

      // Store secret temporarily (not enabled yet - user needs to verify first)
      await supabase
        .from('users')
        .update({
          totpSecret: secret, // In production, encrypt this
          twoFactorMethod: 'TOTP',
          updatedAt: new Date().toISOString(),
        })
        .eq('id', user.id)

      return NextResponse.json({
        secret,
        qrCodeUrl,
        manualEntryKey,
        message: 'Scan the QR code with your authenticator app',
      })
    } else if (method === 'EMAIL') {
      // Generate email OTP
      const otpCode = generateEmailOTP()
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

      // Store OTP temporarily
      await supabase
        .from('users')
        .update({
          emailOtpCode: otpCode,
          emailOtpExpiry: otpExpiry.toISOString(),
          twoFactorMethod: 'EMAIL',
          updatedAt: new Date().toISOString(),
        })
        .eq('id', user.id)

      // Send email OTP
      await sendEmailOTP(user.email, otpCode)

      return NextResponse.json({
        message: 'Verification code sent to your email',
        email: user.email, // For display purposes
      })
    } else if (method === 'SMS') {
      // Check if user has a phone number
      if (!user.phone) {
        return NextResponse.json(
          { error: 'Phone number is required for SMS 2FA. Please add a phone number in your profile settings.' },
          { status: 400 }
        )
      }

      // Generate SMS OTP
      const otpCode = generateSMSOTP()
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

      // Store OTP temporarily
      await supabase
        .from('users')
        .update({
          smsOtpCode: otpCode,
          smsOtpExpiry: otpExpiry.toISOString(),
          twoFactorMethod: 'SMS',
          updatedAt: new Date().toISOString(),
        })
        .eq('id', user.id)

      // Send SMS OTP
      await sendSMSOTP(user.phone, otpCode)

      return NextResponse.json({
        message: 'Verification code sent to your phone',
        phone: user.phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) ***-$3'), // Masked phone for display
      })
    }

    return NextResponse.json(
      { error: 'Invalid method' },
      { status: 400 }
    )
  } catch (error) {
    console.error('2FA setup error:', error)
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

