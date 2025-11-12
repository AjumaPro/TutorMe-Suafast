import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const assignmentSchema = z.object({
  bookingId: z.string(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
})

const reviewAssignmentSchema = z.object({
  assignmentId: z.string(),
  feedback: z.string().optional(),
  grade: z.string().optional(),
  status: z.enum(['REVIEWED', 'COMPLETED']),
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
    const validatedData = assignmentSchema.parse(body)

    // Verify booking exists and belongs to student
    const booking = await prisma.booking.findUnique({
      where: { id: validatedData.bookingId },
      include: {
        tutor: { include: { user: true } },
        student: true,
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    if (booking.studentId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only submit assignments for your own bookings' },
        { status: 403 }
      )
    }

    const assignment = await prisma.assignment.create({
      data: {
        bookingId: validatedData.bookingId,
        studentId: session.user.id,
        tutorId: booking.tutorId,
        title: validatedData.title,
        description: validatedData.description,
        fileUrl: validatedData.fileUrl,
        fileName: validatedData.fileName,
        fileSize: validatedData.fileSize,
        status: 'SUBMITTED',
      },
      include: {
        booking: {
          include: {
            tutor: { include: { user: true } },
          },
        },
      },
    })

    // Create notification for tutor
    const { createNotification } = await import('@/lib/notifications')
    await createNotification({
      userId: booking.tutor.userId,
      type: 'ASSIGNMENT_SUBMITTED',
      title: 'New Assignment Submitted',
      message: `${session.user.name} submitted an assignment: ${validatedData.title}`,
      link: `/assignments/${assignment.id}`,
    })

    return NextResponse.json(
      { message: 'Assignment submitted successfully', assignment },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Assignment submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('bookingId')
    const status = searchParams.get('status')

    const where: any = {}

    if (session.user.role === 'PARENT') {
      where.studentId = session.user.id
    } else if (session.user.role === 'TUTOR') {
      const tutorProfile = await prisma.tutorProfile.findUnique({
        where: { userId: session.user.id },
      })
      if (tutorProfile) {
        where.tutorId = tutorProfile.id
      } else {
        return NextResponse.json({ assignments: [] })
      }
    }

    if (bookingId) {
      where.bookingId = bookingId
    }

    if (status) {
      where.status = status
    }

    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        booking: {
          include: {
            tutor: { include: { user: { select: { name: true } } } },
            student: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ assignments })
  } catch (error) {
    console.error('Assignments fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TUTOR') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = reviewAssignmentSchema.parse(body)

    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!tutorProfile) {
      return NextResponse.json(
        { error: 'Tutor profile not found' },
        { status: 404 }
      )
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: validatedData.assignmentId },
      include: { student: true },
    })

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    if (assignment.tutorId !== tutorProfile.id) {
      return NextResponse.json(
        { error: 'You can only review assignments for your own students' },
        { status: 403 }
      )
    }

    const updatedAssignment = await prisma.assignment.update({
      where: { id: validatedData.assignmentId },
      data: {
        feedback: validatedData.feedback,
        grade: validatedData.grade,
        status: validatedData.status,
        reviewedAt: new Date(),
      },
    })

    // Create notification for student
    const { createNotification } = await import('@/lib/notifications')
    await createNotification({
      userId: assignment.studentId,
      type: 'ASSIGNMENT_REVIEWED',
      title: 'Assignment Reviewed',
      message: `Your assignment "${assignment.title}" has been reviewed`,
      link: `/assignments/${assignment.id}`,
    })

    return NextResponse.json({
      message: 'Assignment reviewed successfully',
      assignment: updatedAssignment,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Assignment review error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

