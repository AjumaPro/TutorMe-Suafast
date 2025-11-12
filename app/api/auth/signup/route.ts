import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import crypto from 'crypto'

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['PARENT', 'TUTOR', 'ADMIN']).optional(),
  phone: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = signupSchema.parse(body)

    // Normalize email
    const email = validatedData.email.toLowerCase().trim()

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10)

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const verificationTokenExpiry = new Date(Date.now() + 24 * 3600000) // 24 hours

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: validatedData.name.trim(),
        role: validatedData.role || 'PARENT',
        phone: validatedData.phone?.trim() || null,
        resetToken: verificationToken, // Using resetToken field for verification
        resetTokenExpiry: verificationTokenExpiry,
        emailVerified: null, // Will be set when email is verified
      }
    })

    // In production, send verification email here
    if (process.env.NODE_ENV === 'development') {
      console.log(`Email verification token for ${email}: ${verificationToken}`)
      console.log(`Verification link: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/verify-email?token=${verificationToken}`)
    }

    // If tutor, create tutor profile
    if (user.role === 'TUTOR') {
      await prisma.tutorProfile.create({
        data: {
          userId: user.id,
          hourlyRate: 0, // Will be set later
          isApproved: false,
          subjects: '[]', // Empty array as JSON string
          grades: '[]', // Empty array as JSON string
        }
      })
    }

    return NextResponse.json(
      { 
        message: 'Account created successfully',
        userId: user.id,
        role: user.role
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      )
    }

    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    )
  }
}
