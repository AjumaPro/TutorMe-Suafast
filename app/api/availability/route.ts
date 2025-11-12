import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const availabilitySchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  isAvailable: z.boolean().default(true),
})

const bulkAvailabilitySchema = z.object({
  slots: z.array(availabilitySchema),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TUTOR') {
      return NextResponse.json(
        { error: 'Unauthorized - Only tutors can set availability' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Check if it's bulk update
    if (body.slots && Array.isArray(body.slots)) {
      const validatedData = bulkAvailabilitySchema.parse(body)
      
      const tutorProfile = await prisma.tutorProfile.findUnique({
        where: { userId: session.user.id },
      })

      if (!tutorProfile) {
        return NextResponse.json(
          { error: 'Tutor profile not found' },
          { status: 404 }
        )
      }

      // Delete existing slots
      await prisma.availabilitySlot.deleteMany({
        where: { tutorId: tutorProfile.id },
      })

      // Create new slots
      const slots = await prisma.availabilitySlot.createMany({
        data: validatedData.slots.map((slot) => ({
          tutorId: tutorProfile.id,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isAvailable: slot.isAvailable,
        })),
      })

      return NextResponse.json(
        { message: 'Availability updated successfully', slots },
        { status: 201 }
      )
    } else {
      // Single slot
      const validatedData = availabilitySchema.parse(body)
      
      const tutorProfile = await prisma.tutorProfile.findUnique({
        where: { userId: session.user.id },
      })

      if (!tutorProfile) {
        return NextResponse.json(
          { error: 'Tutor profile not found' },
          { status: 404 }
        )
      }

      const slot = await prisma.availabilitySlot.create({
        data: {
          tutorId: tutorProfile.id,
          dayOfWeek: validatedData.dayOfWeek,
          startTime: validatedData.startTime,
          endTime: validatedData.endTime,
          isAvailable: validatedData.isAvailable,
        },
      })

      return NextResponse.json(
        { message: 'Availability slot created successfully', slot },
        { status: 201 }
      )
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Availability creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const tutorId = searchParams.get('tutorId')

    let targetTutorId: string | null = null

    if (tutorId) {
      // Public access to tutor availability - verify tutor exists and is approved
      const tutorProfile = await prisma.tutorProfile.findUnique({
        where: { id: tutorId },
        select: { id: true, isApproved: true },
      })
      
      if (!tutorProfile) {
        return NextResponse.json(
          { error: 'Tutor not found' },
          { status: 404 }
        )
      }
      
      if (!tutorProfile.isApproved) {
        return NextResponse.json(
          { error: 'Tutor profile not approved' },
          { status: 403 }
        )
      }
      
      targetTutorId = tutorProfile.id
    } else if (session?.user.role === 'TUTOR') {
      // Tutor viewing their own availability
      const tutorProfile = await prisma.tutorProfile.findUnique({
        where: { userId: session.user.id },
      })
      targetTutorId = tutorProfile?.id || null
    } else {
      return NextResponse.json(
        { error: 'Unauthorized - Please provide tutorId or be logged in as a tutor' },
        { status: 401 }
      )
    }

    if (!targetTutorId) {
      return NextResponse.json(
        { error: 'Tutor not found' },
        { status: 404 }
      )
    }

    const slots = await prisma.availabilitySlot.findMany({
      where: { tutorId: targetTutorId },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' },
      ],
    })

    return NextResponse.json({ slots })
  } catch (error) {
    console.error('Availability fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

