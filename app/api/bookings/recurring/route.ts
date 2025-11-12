import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { createNotification } from '@/lib/notifications'

const recurringBookingSchema = z.object({
  tutorId: z.string(),
  subject: z.string(),
  lessonType: z.enum(['IN_PERSON', 'ONLINE']),
  startDate: z.string().datetime(),
  duration: z.number().min(30).max(180),
  price: z.number().min(0),
  recurringPattern: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY']),
  numberOfOccurrences: z.number().min(2).max(52),
  addressId: z.string().optional(),
  notes: z.string().optional(),
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
    const validatedData = recurringBookingSchema.parse(body)

    // Verify tutor exists and is approved
    const tutor = await prisma.tutorProfile.findUnique({
      where: { id: validatedData.tutorId },
      include: { user: true },
    })

    if (!tutor || !tutor.isApproved) {
      return NextResponse.json(
        { error: 'Tutor not found or not approved' },
        { status: 404 }
      )
    }

    const startDate = new Date(validatedData.startDate)
    if (startDate <= new Date()) {
      return NextResponse.json(
        { error: 'Start date must be in the future' },
        { status: 400 }
      )
    }

    // Calculate end date based on number of occurrences
    const endDate = new Date(startDate)
    const occurrences = validatedData.numberOfOccurrences

    switch (validatedData.recurringPattern) {
      case 'WEEKLY':
        endDate.setDate(endDate.getDate() + (occurrences - 1) * 7)
        break
      case 'BIWEEKLY':
        endDate.setDate(endDate.getDate() + (occurrences - 1) * 14)
        break
      case 'MONTHLY':
        endDate.setMonth(endDate.getMonth() + (occurrences - 1))
        break
    }

    // Create parent booking
    const parentBooking = await prisma.booking.create({
      data: {
        studentId: session.user.id,
        tutorId: validatedData.tutorId,
        subject: validatedData.subject,
        lessonType: validatedData.lessonType,
        scheduledAt: startDate,
        duration: validatedData.duration,
        price: validatedData.price,
        addressId: validatedData.addressId,
        notes: validatedData.notes,
        status: 'PENDING',
        isRecurring: true,
        recurringPattern: validatedData.recurringPattern,
        recurringEndDate: endDate,
      },
    })

    // Create child bookings
    const bookings = [parentBooking]
    const currentDate = new Date(startDate)

    for (let i = 1; i < occurrences; i++) {
      const nextDate = new Date(currentDate)
      
      switch (validatedData.recurringPattern) {
        case 'WEEKLY':
          nextDate.setDate(nextDate.getDate() + 7)
          break
        case 'BIWEEKLY':
          nextDate.setDate(nextDate.getDate() + 14)
          break
        case 'MONTHLY':
          nextDate.setMonth(nextDate.getMonth() + 1)
          break
      }

      const childBooking = await prisma.booking.create({
        data: {
          studentId: session.user.id,
          tutorId: validatedData.tutorId,
          subject: validatedData.subject,
          lessonType: validatedData.lessonType,
          scheduledAt: nextDate,
          duration: validatedData.duration,
          price: validatedData.price,
          addressId: validatedData.addressId,
          notes: validatedData.notes,
          status: 'PENDING',
          isRecurring: true,
          recurringPattern: validatedData.recurringPattern,
          parentBookingId: parentBooking.id,
        },
      })

      bookings.push(childBooking)
      currentDate.setTime(nextDate.getTime())
    }

    // Create notifications
    await createNotification({
      userId: session.user.id,
      type: 'BOOKING_CREATED',
      title: 'Recurring Bookings Created',
      message: `You've created ${occurrences} recurring ${validatedData.recurringPattern.toLowerCase()} lessons with ${tutor.user.name}`,
      link: `/bookings/${parentBooking.id}`,
    })

    await createNotification({
      userId: tutor.userId,
      type: 'BOOKING_CREATED',
      title: 'New Recurring Bookings',
      message: `${session.user.name} has booked ${occurrences} recurring lessons`,
      link: `/lessons`,
    })

    return NextResponse.json(
      {
        message: 'Recurring bookings created successfully',
        parentBooking,
        bookings,
        totalBookings: bookings.length,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors)
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Recurring booking creation error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      error: error,
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : String(error))
          : undefined
      },
      { status: 500 }
    )
  }
}

