import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const joinGroupClassSchema = z.object({
  groupClassId: z.string(),
})

// Get available group classes for a tutor
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tutorId = searchParams.get('tutorId')
    const subject = searchParams.get('subject')
    const scheduledAt = searchParams.get('scheduledAt')

    if (!tutorId) {
      return NextResponse.json(
        { error: 'Tutor ID is required' },
        { status: 400 }
      )
    }

    // Find group classes for this tutor
    const whereClause: any = {
      tutorId,
      isGroupClass: true,
      status: {
        not: 'CANCELLED',
      },
      scheduledAt: {
        gte: new Date(), // Only future classes
      },
    }

    if (subject) {
      whereClause.subject = subject
    }

    if (scheduledAt) {
      const targetDate = new Date(scheduledAt)
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0))
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999))
      whereClause.scheduledAt = {
        gte: startOfDay,
        lte: endOfDay,
      }
    }

    // Get all group class bookings
    const allGroupBookings = await prisma.booking.findMany({
      where: {
        ...whereClause,
        isGroupClass: true,
      },
      include: {
        student: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
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
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    })

    // Filter to get only parent group classes (where groupClassId equals id)
    const parentGroupClasses = allGroupBookings.filter(
      (booking) => booking.groupClassId === booking.id || booking.groupClassId === null
    )

    // For each group class, count current participants
    const groupClassesWithCount = await Promise.all(
      parentGroupClasses.map(async (groupClass) => {
        const participantCount = await prisma.booking.count({
          where: {
            OR: [
              { id: groupClass.id }, // The parent booking itself
              { groupClassId: groupClass.id }, // All bookings that joined this group
            ],
            status: {
              not: 'CANCELLED',
            },
          },
        })

        return {
          ...groupClass,
          currentParticipants: participantCount,
          availableSpots: groupClass.maxParticipants - participantCount,
        }
      })
    )

    // Filter out full classes
    const availableGroupClasses = groupClassesWithCount.filter(
      (gc) => gc.availableSpots > 0
    )

    return NextResponse.json({ groupClasses: availableGroupClasses })
  } catch (error) {
    console.error('Error fetching group classes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Join an existing group class
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
    const validatedData = joinGroupClassSchema.parse(body)

    // Get the parent group class
    const parentGroupClass = await prisma.booking.findUnique({
      where: { id: validatedData.groupClassId },
      include: {
        tutor: true,
      },
    })

    if (!parentGroupClass || !parentGroupClass.isGroupClass) {
      return NextResponse.json(
        { error: 'Group class not found' },
        { status: 404 }
      )
    }

    // Check if class is full
    const participantCount = await prisma.booking.count({
      where: {
        OR: [
          { id: parentGroupClass.id },
          { groupClassId: parentGroupClass.id },
        ],
        status: {
          not: 'CANCELLED',
        },
      },
    })

    if (participantCount >= parentGroupClass.maxParticipants) {
      return NextResponse.json(
        { error: 'Group class is full' },
        { status: 400 }
      )
    }

    // Check if user already joined this group class
    const existingBooking = await prisma.booking.findFirst({
      where: {
        studentId: session.user.id,
        OR: [
          { id: parentGroupClass.id },
          { groupClassId: parentGroupClass.id },
        ],
        status: {
          not: 'CANCELLED',
        },
      },
    })

    if (existingBooking) {
      return NextResponse.json(
        { error: 'You have already joined this group class' },
        { status: 400 }
      )
    }

    // Create a booking that joins the group class
    const booking = await prisma.booking.create({
      data: {
        studentId: session.user.id,
        tutorId: parentGroupClass.tutorId,
        subject: parentGroupClass.subject,
        lessonType: parentGroupClass.lessonType,
        scheduledAt: parentGroupClass.scheduledAt,
        duration: parentGroupClass.duration,
        price: parentGroupClass.price,
        addressId: parentGroupClass.addressId,
        notes: parentGroupClass.notes,
        status: 'PENDING',
        isGroupClass: true,
        groupClassId: parentGroupClass.id,
        maxParticipants: parentGroupClass.maxParticipants,
      },
    })

    return NextResponse.json(
      { message: 'Successfully joined group class', booking },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error joining group class:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

