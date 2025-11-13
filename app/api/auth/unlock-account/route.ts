import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-db'
import { z } from 'zod'

const unlockAccountSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    // Allow admins or the user themselves to unlock
    const body = await request.json()
    const validatedData = unlockAccountSchema.parse(body)

    const email = validatedData.email.toLowerCase().trim()

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (!user) {
      // Don't reveal if user exists
      return NextResponse.json(
        { message: 'If an account exists, it has been unlocked.' },
        { status: 200 }
      )
    }

    // Check if user is trying to unlock their own account or is admin
    if (session && (session.user.email === email || session.user.role === 'ADMIN')) {
      await supabase
        .from('users')
        .update({
          accountLockedUntil: null,
          failedLoginAttempts: 0,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', user.id)

      return NextResponse.json(
        { message: 'Account unlocked successfully' },
        { status: 200 }
      )
    }

    // For security, always return success
    return NextResponse.json(
      { message: 'If an account exists, it has been unlocked.' },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    console.error('Unlock account error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

