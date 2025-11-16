import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-db'
import { z } from 'zod'
import crypto from 'crypto'
import { sendPasswordResetEmail } from '@/lib/email'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = forgotPasswordSchema.parse(body)

    // Normalize email
    const email = validatedData.email.toLowerCase().trim()

    // Find user
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    // Always return success to prevent email enumeration
    // In production, you would send an email here
    if (user) {
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex')
      const resetTokenExpiry = new Date(Date.now() + 3600000).toISOString() // 1 hour from now

      // Store reset token in database
      await supabase
        .from('users')
        .update({
          resetToken,
          resetTokenExpiry,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', user.id)

      // Send password reset email
      try {
        const emailSent = await sendPasswordResetEmail(
          user.email,
          user.name || 'User',
          resetToken
        )

        if (emailSent) {
          console.log(`✅ Password reset email sent to ${email}`)
        } else {
          console.error(`❌ Failed to send password reset email to ${email}`)
          // Still return success to prevent email enumeration
        }
      } catch (emailError) {
        console.error('Error sending password reset email:', emailError)
        // Log to console as fallback in development
      if (process.env.NODE_ENV === 'development') {
          const resetLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`
          console.log(`📧 Password reset link (fallback): ${resetLink}`)
        }
        // Still return success to prevent email enumeration
      }
    }

    // Always return success to prevent email enumeration
    return NextResponse.json(
      {
        message: 'If an account with that email exists, we have sent a password reset link.',
      },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

