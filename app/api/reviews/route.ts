import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const reviewSchema = z.object({
  bookingId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'PARENT') {
      return NextResponse.json(
        { error: 'Unauthorized - Only parents can leave reviews' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = reviewSchema.parse(body)

    // Verify booking exists and belongs to the student
    const booking = await prisma.booking.findUnique({
      where: { id: validatedData.bookingId },
      include: {
        tutor: true,
        review: true,
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
        { error: 'Unauthorized - This booking does not belong to you' },
        { status: 403 }
      )
    }

    if (booking.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'You can only review completed lessons' },
        { status: 400 }
      )
    }

    if (booking.review) {
      return NextResponse.json(
        { error: 'You have already reviewed this lesson' },
        { status: 400 }
      )
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        bookingId: validatedData.bookingId,
        studentId: session.user.id,
        tutorId: booking.tutorId,
        rating: validatedData.rating,
        comment: validatedData.comment,
      },
      include: {
        student: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    })

    // Update tutor rating
    const tutorReviews = await prisma.review.findMany({
      where: { tutorId: booking.tutorId },
    })

    const averageRating = tutorReviews.reduce((sum, r) => sum + r.rating, 0) / tutorReviews.length

    await prisma.tutorProfile.update({
      where: { id: booking.tutorId },
      data: {
        rating: averageRating,
        totalReviews: tutorReviews.length,
      },
    })

    return NextResponse.json(
      { message: 'Review submitted successfully', review },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Review creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tutorId = searchParams.get('tutorId')
    const bookingId = searchParams.get('bookingId')

    if (!tutorId && !bookingId) {
      return NextResponse.json(
        { error: 'Either tutorId or bookingId is required' },
        { status: 400 }
      )
    }

    const where: any = {}
    if (tutorId) where.tutorId = tutorId
    if (bookingId) where.bookingId = bookingId

    const reviews = await prisma.review.findMany({
      where,
      include: {
        student: {
          select: {
            name: true,
            image: true,
          },
        },
        booking: {
          select: {
            subject: true,
            scheduledAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ reviews })
  } catch (error) {
    console.error('Review fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

