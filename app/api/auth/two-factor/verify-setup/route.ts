import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-db'
import { verifyTOTPToken, generateBackupCodes, hashBackupCodesArray } from '@/lib/two-factor'
import { z } from 'zod'

const verifySetupSchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits'),
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
    const { code, method } = verifySetupSchema.parse(body)

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

    let isValid = false

    if (method === 'TOTP') {
      if (!user.totpSecret) {
        return NextResponse.json(
          { error: 'TOTP secret not found. Please set up 2FA again.' },
          { status: 400 }
        )
      }

      isValid = verifyTOTPToken(user.totpSecret, code)
    } else if (method === 'EMAIL') {
      if (!user.emailOtpCode || !user.emailOtpExpiry) {
        return NextResponse.json(
          { error: 'Email OTP not found. Please request a new code.' },
          { status: 400 }
        )
      }

      // Check if OTP expired
      if (new Date() > new Date(user.emailOtpExpiry)) {
        return NextResponse.json(
          { error: 'Verification code has expired. Please request a new one.' },
          { status: 400 }
        )
      }

      isValid = user.emailOtpCode === code
    } else if (method === 'SMS') {
      if (!user.smsOtpCode || !user.smsOtpExpiry) {
        return NextResponse.json(
          { error: 'SMS OTP not found. Please request a new code.' },
          { status: 400 }
        )
      }

      // Check if OTP expired
      if (new Date() > new Date(user.smsOtpExpiry)) {
        return NextResponse.json(
          { error: 'Verification code has expired. Please request a new one.' },
          { status: 400 }
        )
      }

      isValid = user.smsOtpCode === code
    }

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      )
    }

    // Generate backup codes
    const backupCodes = generateBackupCodes(10)
    const hashedBackupCodes = await hashBackupCodesArray(backupCodes)

    // Enable 2FA
    await supabase
      .from('users')
      .update({
        twoFactorEnabled: true,
        twoFactorMethod: method,
        backupCodes: JSON.stringify(hashedBackupCodes),
        // Clear temporary OTP data
        emailOtpCode: null,
        emailOtpExpiry: null,
        smsOtpCode: null,
        smsOtpExpiry: null,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', user.id)

    return NextResponse.json({
      message: 'Two-factor authentication enabled successfully',
      backupCodes, // Return plain codes only once - user should save them
    })
  } catch (error) {
    console.error('2FA verify setup error:', error)
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

