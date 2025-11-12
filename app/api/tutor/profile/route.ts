import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stringifyJsonArray } from '@/lib/utils'
import { z } from 'zod'

const profileSchema = z.object({
  bio: z.string().min(1, 'Bio is required'),
  subjects: z.array(z.string()).min(1, 'Select at least one subject'),
  grades: z.array(z.string()).min(1, 'Select at least one grade level'),
  experience: z.number().min(0).optional(),
  hourlyRate: z.number().min(0, 'Hourly rate must be positive'),
  credentials: z.string().url().optional().or(z.literal('')),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TUTOR') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = profileSchema.parse(body)

    // Update or create tutor profile
    // Convert arrays to JSON strings for SQLite compatibility
    const tutorProfile = await prisma.tutorProfile.upsert({
      where: { userId: session.user.id },
      update: {
        bio: validatedData.bio,
        subjects: stringifyJsonArray(validatedData.subjects),
        grades: stringifyJsonArray(validatedData.grades),
        experience: validatedData.experience,
        hourlyRate: validatedData.hourlyRate,
        credentials: validatedData.credentials || null,
      },
      create: {
        userId: session.user.id,
        bio: validatedData.bio,
        subjects: stringifyJsonArray(validatedData.subjects),
        grades: stringifyJsonArray(validatedData.grades),
        experience: validatedData.experience,
        hourlyRate: validatedData.hourlyRate,
        credentials: validatedData.credentials || null,
        isApproved: false,
      },
    })

    return NextResponse.json(
      { message: 'Profile updated successfully', tutorProfile },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

