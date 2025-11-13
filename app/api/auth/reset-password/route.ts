import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-db'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = resetPasswordSchema.parse(body)

    // Find user by reset token
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .eq('resetToken', validatedData.token)
    
    const user = users && users.length > 0 && users.find(u => {
      if (!u.resetTokenExpiry) return false
      const expiry = typeof u.resetTokenExpiry === 'string' 
        ? new Date(u.resetTokenExpiry) 
        : u.resetTokenExpiry
      return expiry > new Date()
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (validatedData.password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10)

    // Update user's password and invalidate reset token
    await supabase
      .from('users')
      .update({
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        failedLoginAttempts: 0, // Reset failed attempts
        accountLockedUntil: null, // Unlock account if locked
        updatedAt: new Date().toISOString(),
      })
      .eq('id', user.id)

    return NextResponse.json(
      {
        message: 'Password has been reset successfully. You can now sign in with your new password.',
      },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

