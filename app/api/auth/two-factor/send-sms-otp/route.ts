import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-db'
import { generateSMSOTP, sendSMSOTP } from '@/lib/two-factor'

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

    if (user.twoFactorMethod !== 'SMS') {
      return NextResponse.json(
        { error: 'SMS 2FA is not enabled for this account' },
        { status: 400 }
      )
    }

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
  } catch (error) {
    console.error('Send SMS OTP error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

