import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const bookingSchema = z.object({
  tutorId: z.string(),
  subject: z.string(),
  lessonType: z.enum(['IN_PERSON', 'ONLINE']),
  scheduledAt: z.string().datetime(),
  duration: z.number().min(30).max(180),
  price: z.number().min(0),
  addressId: z.string().optional(),
  notes: z.string().optional(),
  isGroupClass: z.boolean().optional().default(false),
  maxParticipants: z.number().min(2).max(10).optional().default(10),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'PARENT') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = bookingSchema.parse(body)

    // Verify tutor exists and is approved
    const tutor = await prisma.tutorProfile.findUnique({
      where: { id: validatedData.tutorId },
    })

    if (!tutor || !tutor.isApproved) {
      return NextResponse.json(
        { error: 'Tutor not found or not approved' },
        { status: 404 }
      )
    }

    // Verify scheduled time is in the future
    const scheduledAt = new Date(validatedData.scheduledAt)
    if (scheduledAt <= new Date()) {
      return NextResponse.json(
        { error: 'Scheduled time must be in the future' },
        { status: 400 }
      )
    }

    // Create booking
    const bookingData: any = {
      studentId: session.user.id,
      tutorId: validatedData.tutorId,
      subject: validatedData.subject,
      lessonType: validatedData.lessonType,
      scheduledAt: scheduledAt,
      duration: validatedData.duration,
      price: validatedData.price,
      status: 'PENDING',
      isGroupClass: validatedData.isGroupClass || false,
      maxParticipants: validatedData.maxParticipants || 10,
      groupClassId: null, // Will be updated if it's a group class
    }

    // Only add optional fields if they have values
    if (validatedData.addressId) {
      bookingData.addressId = validatedData.addressId
    }
    if (validatedData.notes && validatedData.notes.trim()) {
      bookingData.notes = validatedData.notes.trim()
    }

    const booking = await prisma.booking.create({
      data: bookingData,
    })

    // If it's a group class, update the groupClassId to point to itself
    if (validatedData.isGroupClass) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { groupClassId: booking.id },
      })
    }

    return NextResponse.json(
      { message: 'Booking created successfully', booking },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Booking creation error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: JSON.stringify(error, Object.getOwnPropertyNames(error)),
    })
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : 'Unknown error')
          : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const tutorId = searchParams.get('tutorId')

    // Allow public access if tutorId is provided (for availability checking)
    if (tutorId) {
      const bookings = await prisma.booking.findMany({
        where: {
          tutorId: tutorId,
          status: {
            not: 'CANCELLED',
          },
        },
        select: {
          id: true,
          scheduledAt: true,
          duration: true,
          status: true,
        },
        orderBy: {
          scheduledAt: 'asc',
        },
      })

      return NextResponse.json({ bookings })
    }

    // Otherwise require authentication
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch bookings based on user role
    let bookings: any[] = []

    if (session.user.role === 'PARENT') {
      bookings = await prisma.booking.findMany({
        where: {
          studentId: session.user.id,
        },
        include: {
          tutor: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
          payment: true,
          review: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
    } else if (session.user.role === 'TUTOR') {
      const tutorProfile = await prisma.tutorProfile.findUnique({
        where: { userId: session.user.id },
      })

      if (tutorProfile) {
        bookings = await prisma.booking.findMany({
          where: {
            tutorId: tutorProfile.id,
          },
          include: {
            student: {
              select: {
                name: true,
                email: true,
                image: true,
              },
            },
            payment: true,
            review: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        })
      }
    }

    return NextResponse.json({ bookings })
  } catch (error) {
    console.error('Booking fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

