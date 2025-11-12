import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const progressEntrySchema = z.object({
  studentId: z.string(),
  tutorId: z.string().optional(),
  bookingId: z.string().optional(),
  subject: z.string().min(1, 'Subject is required'),
  topic: z.string().optional(),
  score: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  milestone: z.string().optional(),
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
    const validatedData = progressEntrySchema.parse(body)

    // Verify student belongs to tutor or is the student themselves
    if (session.user.role === 'TUTOR') {
      const tutorProfile = await prisma.tutorProfile.findUnique({
        where: { userId: session.user.id },
      })

      if (!tutorProfile || validatedData.tutorId !== tutorProfile.id) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        )
      }

      // Verify booking belongs to tutor if provided
      if (validatedData.bookingId) {
        const booking = await prisma.booking.findUnique({
          where: { id: validatedData.bookingId },
        })

        if (!booking || booking.tutorId !== tutorProfile.id) {
          return NextResponse.json(
            { error: 'Invalid booking' },
            { status: 400 }
          )
        }
      }
    } else if (session.user.role === 'PARENT') {
      if (validatedData.studentId !== session.user.id) {
        return NextResponse.json(
          { error: 'You can only add progress for yourself' },
          { status: 403 }
        )
      }
    }

    const progressEntry = await prisma.progressEntry.create({
      data: {
        studentId: validatedData.studentId,
        tutorId: validatedData.tutorId,
        bookingId: validatedData.bookingId,
        subject: validatedData.subject,
        topic: validatedData.topic,
        score: validatedData.score,
        notes: validatedData.notes,
        milestone: validatedData.milestone,
      },
      include: {
        student: {
          select: {
            name: true,
          },
        },
      },
    })

    // Create notification for student
    if (session.user.role === 'TUTOR') {
      const { createNotification } = await import('@/lib/notifications')
      await createNotification({
        userId: validatedData.studentId,
        type: 'PROGRESS_UPDATED',
        title: 'Progress Updated',
        message: `Your progress in ${validatedData.subject} has been updated`,
        link: `/progress`,
      })
    }

    return NextResponse.json(
      { message: 'Progress entry created successfully', progressEntry },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Progress entry creation error:', error)
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
    const studentId = searchParams.get('studentId')
    const subject = searchParams.get('subject')

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
        return NextResponse.json({ progressEntries: [] })
      }
    }

    if (studentId) {
      where.studentId = studentId
    }

    if (subject) {
      where.subject = subject
    }

    const progressEntries = await prisma.progressEntry.findMany({
      where,
      include: {
        student: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Calculate statistics
    const stats = {
      totalEntries: progressEntries.length,
      averageScore: progressEntries.length > 0
        ? progressEntries
            .filter((e) => e.score !== null)
            .reduce((sum, e) => sum + (e.score || 0), 0) /
          progressEntries.filter((e) => e.score !== null).length
        : 0,
      subjects: Array.from(
        new Set(progressEntries.map((e) => e.subject))
      ),
      milestones: progressEntries.filter((e) => e.milestone !== null).length,
    }

    return NextResponse.json({
      progressEntries,
      stats,
    })
  } catch (error) {
    console.error('Progress fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

