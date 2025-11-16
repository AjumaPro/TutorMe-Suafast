import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-db'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const changePasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters long'),
})

// Change student password (admin only - no current password required)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = changePasswordSchema.parse(body)

    // Check if student exists and is a PARENT role
    const { data: student } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .eq('role', 'PARENT')
      .single()

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Validate password strength
    if (validatedData.newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(validatedData.newPassword, 10)

    // Update password and reset security-related fields
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password: hashedPassword,
        failedLoginAttempts: 0, // Reset failed attempts
        accountLockedUntil: null, // Unlock account if locked
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error updating student password:', updateError)
      return NextResponse.json(
        { 
          error: updateError.message || 'Failed to update password',
          details: process.env.NODE_ENV === 'development' ? updateError : undefined
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        message: 'Student password changed successfully' 
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
    console.error('Password change error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

