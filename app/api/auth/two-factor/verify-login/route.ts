import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-db'
import { verifyTOTPToken, verifyBackupCode } from '@/lib/two-factor'
import { z } from 'zod'
import crypto from 'crypto'

const verifyLoginSchema = z.object({
  email: z.string().email(),
  code: z.string().min(6, 'Code must be at least 6 characters'),
  isBackupCode: z.boolean().optional().default(false),
}).refine(
  (data) => {
    if (data.isBackupCode) {
      return data.code.length >= 8
    }
    return data.code.length === 6
  },
  {
    message: 'Backup codes must be at least 8 characters, verification codes must be 6 digits',
    path: ['code'],
  }
)

// Store temporary session for 2FA verification
const pending2FASessions = new Map<string, { userId: string; expiresAt: Date }>()

function createPending2FASession(userId: string): string {
  const sessionToken = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  pending2FASessions.set(sessionToken, { userId, expiresAt })

  // Clean up expired sessions
  setTimeout(() => {
    pending2FASessions.delete(sessionToken)
  }, 10 * 60 * 1000)

  return sessionToken
}

function getPending2FASession(sessionToken: string): { userId: string } | null {
  const session = pending2FASessions.get(sessionToken)
  if (!session) return null

  if (new Date() > session.expiresAt) {
    pending2FASessions.delete(sessionToken)
    return null
  }

  return { userId: session.userId }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, code, isBackupCode } = verifyLoginSchema.parse(body)

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

    let isValid = false

    if (isBackupCode) {
      // Verify backup code
      if (!user.backupCodes) {
        return NextResponse.json(
          { error: 'No backup codes found' },
          { status: 400 }
        )
      }

      const hashedBackupCodes: string[] = JSON.parse(user.backupCodes)
      
      // Check each backup code
      for (let i = 0; i < hashedBackupCodes.length; i++) {
        const matches = await verifyBackupCode(code, hashedBackupCodes[i])
        if (matches) {
          // Remove used backup code
          hashedBackupCodes.splice(i, 1)
          await supabase
            .from('users')
            .update({
              backupCodes: JSON.stringify(hashedBackupCodes),
              updatedAt: new Date().toISOString(),
            })
            .eq('id', user.id)
          isValid = true
          break
        }
      }
    } else if (user.twoFactorMethod === 'TOTP') {
      if (!user.totpSecret) {
        return NextResponse.json(
          { error: 'TOTP secret not found' },
          { status: 400 }
        )
      }

      isValid = verifyTOTPToken(user.totpSecret, code)
    } else if (user.twoFactorMethod === 'EMAIL') {
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

      // Clear OTP after verification
      if (isValid) {
        await supabase
          .from('users')
          .update({
            emailOtpCode: null,
            emailOtpExpiry: null,
            updatedAt: new Date().toISOString(),
          })
          .eq('id', user.id)
      }
    } else if (user.twoFactorMethod === 'SMS') {
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

      // Clear OTP after verification
      if (isValid) {
        await supabase
          .from('users')
          .update({
            smsOtpCode: null,
            smsOtpExpiry: null,
            updatedAt: new Date().toISOString(),
          })
          .eq('id', user.id)
      }
    }

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 401 }
      )
    }

    // Create pending session token for NextAuth
    const sessionToken = createPending2FASession(user.id)

    return NextResponse.json({
      success: true,
      sessionToken, // This will be used to complete the login
      message: 'Two-factor authentication verified',
    })
  } catch (error) {
    console.error('2FA verify login error:', error)
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

