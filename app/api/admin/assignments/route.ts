import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const assignmentSchema = z.object({
  studentId: z.string(),
  tutorId: z.string(),
  subject: z.string().min(1),
  scheduledAt: z.string().datetime().optional(),
  duration: z.number().min(30).max(180).optional(),
  price: z.number().min(0).optional(),
})

// Create a class assignment (admin assigns student to tutor)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = assignmentSchema.parse(body)

    // Verify student exists
    const student = await prisma.user.findUnique({
      where: { id: validatedData.studentId },
    })

    if (!student || student.role !== 'PARENT') {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

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

    // Create booking/assignment
    const scheduledAt = validatedData.scheduledAt
      ? new Date(validatedData.scheduledAt)
      : new Date(Date.now() + 24 * 60 * 60 * 1000) // Default to tomorrow

    const booking = await prisma.booking.create({
      data: {
        studentId: validatedData.studentId,
        tutorId: validatedData.tutorId,
        subject: validatedData.subject,
        lessonType: 'ONLINE',
        scheduledAt: scheduledAt,
        duration: validatedData.duration || 60,
        price: validatedData.price || tutor.hourlyRate,
        status: 'CONFIRMED', // Auto-confirm admin assignments
        notes: 'Assigned by administrator',
      },
    })

    return NextResponse.json(
      { message: 'Class assigned successfully', booking },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Class assignment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get all class assignments
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: any = {}
    if (status && status !== 'all') {
      where.status = status.toUpperCase()
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        student: {
          select: {
            name: true,
            email: true,
          },
        },
        tutor: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        scheduledAt: 'desc',
      },
    })

    return NextResponse.json({ assignments: bookings })
  } catch (error) {
    console.error('Get assignments error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

