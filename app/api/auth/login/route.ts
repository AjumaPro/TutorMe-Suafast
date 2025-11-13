import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  twoFactorCode: z.string().optional(),
  sessionToken: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, twoFactorCode, sessionToken } = loginSchema.parse(body)

    const normalizedEmail = email.toLowerCase().trim()

    // Note: 2FA functionality is currently disabled due to incomplete implementation
    // If sessionToken is provided, this is a 2FA verification step
    // if (sessionToken) {
    //   // 2FA verification logic would go here
    // }

    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', normalizedEmail)
      .single()
    
    if (userError && userError.code !== 'PGRST116') throw userError

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if account is locked
    const lockoutTime = user.accountLockedUntil
    if (lockoutTime && new Date(lockoutTime) > new Date()) {
      const minutesLeft = Math.ceil((new Date(lockoutTime).getTime() - new Date().getTime()) / 60000)
      return NextResponse.json(
        { error: `Account is locked. Please try again in ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.` },
        { status: 403 }
      )
    }

    // Auto-unlock if lockout period has passed
    if (lockoutTime && new Date(lockoutTime) <= new Date()) {
      await supabase
        .from('users')
        .update({
          accountLockedUntil: null,
          failedLoginAttempts: 0,
        })
        .eq('id', user.id)
    }

    // Verify password
    if (!user.password) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      // Increment failed login attempts
      const failedAttempts = (user.failedLoginAttempts || 0) + 1
      const maxAttempts = 5
      const lockoutDuration = 15 // minutes

      if (failedAttempts >= maxAttempts) {
        const lockoutUntil = new Date(Date.now() + lockoutDuration * 60 * 1000)
        await supabase
          .from('users')
          .update({
            failedLoginAttempts: failedAttempts,
            accountLockedUntil: lockoutUntil.toISOString(),
          })
          .eq('id', user.id)
        return NextResponse.json(
          { error: `Too many failed attempts. Account locked for ${lockoutDuration} minutes.` },
          { status: 403 }
        )
      } else {
        await supabase
          .from('users')
          .update({ failedLoginAttempts: failedAttempts })
          .eq('id', user.id)
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        )
      }
    }

    // Note: 2FA functionality is currently disabled due to incomplete implementation
    // Password is valid - check if 2FA is required
    // if (user.twoFactorEnabled) {
    //   // 2FA logic would go here
    // }

    // No 2FA required - login successful
    // Reset failed attempts
    await supabase
      .from('users')
      .update({
        failedLoginAttempts: 0,
        accountLockedUntil: null,
        lastLoginAt: new Date().toISOString(),
      })
      .eq('id', user.id)

    return NextResponse.json({
      success: true,
      userId: user.id,
      requires2FA: false,
    })
  } catch (error: any) {
    console.error('Login error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    
    // Check for database connection errors
    if (error?.code === 'P1001' || error?.message?.includes("Can't reach database server")) {
      return NextResponse.json(
        { 
          error: 'Database connection failed. Please check your Supabase configuration.',
          details: 'The application cannot connect to the database. Please verify your Supabase project is active and the connection string is correct.'
        },
        { status: 503 }
      )
    }
    
    // Check for Prisma client initialization errors
    if (error?.name === 'PrismaClientInitializationError') {
      return NextResponse.json(
        { 
          error: 'Database connection error',
          details: 'Unable to connect to the database. Please check your database configuration.'
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

