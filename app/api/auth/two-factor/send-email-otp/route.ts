import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-db'
import { generateEmailOTP, sendEmailOTP } from '@/lib/two-factor'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

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

    if (user.twoFactorMethod !== 'EMAIL') {
      return NextResponse.json(
        { error: 'Email 2FA is not enabled for this account' },
        { status: 400 }
      )
    }

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
      email: user.email,
    })
  } catch (error) {
    console.error('Send email OTP error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

