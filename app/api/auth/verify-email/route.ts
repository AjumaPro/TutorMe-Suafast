import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-db'
import crypto from 'crypto'

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

    if (user.emailVerified) {
      return NextResponse.json(
        { message: 'Email is already verified' },
        { status: 200 }
      )
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const verificationTokenExpiry = new Date(Date.now() + 24 * 3600000).toISOString() // 24 hours

    // Store verification token (you would add this field to User model)
    // For now, we'll use resetToken field as a placeholder
    await supabase
      .from('users')
      .update({
        resetToken: verificationToken, // Reusing resetToken field for verification
        resetTokenExpiry: verificationTokenExpiry,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', user.id)

    // In production, send verification email
    if (process.env.NODE_ENV === 'development') {
      console.log(`Email verification token for ${user.email}: ${verificationToken}`)
      console.log(`Verification link: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/verify-email?token=${verificationToken}`)
    }

    return NextResponse.json(
      {
        message: 'Verification email sent. Please check your inbox.',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      )
    }

    // Find user by verification token
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .eq('resetToken', token)
    
    const user = users && users.length > 0 && users.find(u => {
      if (!u.resetTokenExpiry) return false
      const expiry = typeof u.resetTokenExpiry === 'string' 
        ? new Date(u.resetTokenExpiry) 
        : u.resetTokenExpiry
      return expiry > new Date()
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      )
    }

    // Verify email
    await supabase
      .from('users')
      .update({
        emailVerified: new Date().toISOString(),
        resetToken: null,
        resetTokenExpiry: null,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', user.id)

    return NextResponse.json(
      {
        message: 'Email verified successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

