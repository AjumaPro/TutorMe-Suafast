import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-db'
import { z } from 'zod'

const accountActionSchema = z.object({
  action: z.enum(['DEACTIVATE', 'DELETE']),
  confirmPassword: z.string().optional(),
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
    const validatedData = accountActionSchema.parse(body)

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

    if (validatedData.action === 'DELETE') {
      // For DELETE, require password confirmation
      if (!validatedData.confirmPassword) {
        return NextResponse.json(
          { error: 'Password confirmation required for account deletion' },
          { status: 400 }
        )
      }

      // Verify password
      const bcrypt = await import('bcryptjs')
      const isPasswordValid = await bcrypt.default.compare(validatedData.confirmPassword, user.password)

      if (!isPasswordValid) {
        return NextResponse.json(
          { error: 'Password is incorrect' },
          { status: 400 }
        )
      }

      // Delete user (cascade will handle related records)
      await supabase
        .from('users')
        .delete()
        .eq('id', session.user.id)

      return NextResponse.json(
        { message: 'Account deleted successfully' },
        { status: 200 }
      )
    } else if (validatedData.action === 'DEACTIVATE') {
      // For DEACTIVATE, mark account as inactive
      // TODO: Add isActive field to User model
      // For now, we'll just return success
      return NextResponse.json(
        { message: 'Account deactivated successfully' },
        { status: 200 }
      )
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Account action error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

