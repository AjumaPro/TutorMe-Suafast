import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-db'
import { z } from 'zod'

const disableSchema = z.object({
  password: z.string().min(1, 'Password is required'),
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
    const { password } = disableSchema.parse(body)

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Verify password
    const bcrypt = require('bcryptjs')
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      )
    }

    // Disable 2FA
    await supabase
      .from('users')
      .update({
        twoFactorEnabled: false,
        twoFactorMethod: null,
        totpSecret: null,
        backupCodes: null,
        emailOtpCode: null,
        emailOtpExpiry: null,
        smsOtpCode: null,
        smsOtpExpiry: null,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', user.id)

    return NextResponse.json({
      message: 'Two-factor authentication disabled successfully',
    })
  } catch (error) {
    console.error('2FA disable error:', error)
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

