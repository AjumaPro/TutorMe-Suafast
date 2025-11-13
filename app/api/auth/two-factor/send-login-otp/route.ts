import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-db'
import { generateEmailOTP, sendEmailOTP, generateSMSOTP, sendSMSOTP } from '@/lib/two-factor'
import { z } from 'zod'

const sendLoginOTPSchema = z.object({
  email: z.string().email(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = sendLoginOTPSchema.parse(body)

    const normalizedEmail = email.toLowerCase().trim()

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', normalizedEmail)
      .single()

    if (!user || !user.twoFactorEnabled) {
      return NextResponse.json(
        { error: 'Two-factor authentication is not enabled for this account' },
        { status: 400 }
      )
    }

    if (user.twoFactorMethod === 'EMAIL') {
      // Generate new email OTP
      const otpCode = generateEmailOTP()
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

      // Store OTP
      await supabase
        .from('users')
        .update({
          emailOtpCode: otpCode,
          emailOtpExpiry: otpExpiry.toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .eq('id', user.id)

      // Send email OTP
      await sendEmailOTP(user.email, otpCode)

      return NextResponse.json({
        message: 'Verification code sent to your email',
        email: user.email, // Masked email for display
      })
    } else if (user.twoFactorMethod === 'SMS') {
      if (!user.phone) {
        return NextResponse.json(
          { error: 'Phone number is required for SMS 2FA. Please add a phone number in your profile settings.' },
          { status: 400 }
        )
      }

      // Generate new SMS OTP
      const otpCode = generateSMSOTP()
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

      // Store OTP
      await supabase
        .from('users')
        .update({
          smsOtpCode: otpCode,
          smsOtpExpiry: otpExpiry.toISOString(),
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
      { error: 'Invalid 2FA method' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Send login OTP error:', error)
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

