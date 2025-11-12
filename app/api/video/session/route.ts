import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

// Create or get video session for a booking
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { bookingId } = await request.json()

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      )
    }

    // Verify booking exists and user has access
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        tutor: {
          include: {
            user: true,
          },
        },
        student: true,
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Check authorization
    const isAuthorized =
      booking.studentId === session.user.id ||
      booking.tutor.userId === session.user.id ||
      session.user.role === 'ADMIN'

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Check if booking is for online lesson
    if (booking.lessonType !== 'ONLINE') {
      return NextResponse.json(
        { error: 'Video sessions are only available for online lessons' },
        { status: 400 }
      )
    }

    // Check if booking is confirmed
    if (booking.status !== 'CONFIRMED' && booking.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Booking must be confirmed to start video session' },
        { status: 400 }
      )
    }

    // Check if session already exists
    let videoSession = await prisma.videoSession.findUnique({
      where: { bookingId },
    })

    if (!videoSession) {
      // Generate unique session token
      const sessionToken = randomBytes(32).toString('hex')

      // Create new video session
      videoSession = await prisma.videoSession.create({
        data: {
          bookingId,
          sessionToken,
          status: 'ACTIVE',
        },
      })
    }

    return NextResponse.json({
      sessionToken: videoSession.sessionToken,
      sessionId: videoSession.id,
      status: videoSession.status,
    })
  } catch (error) {
    console.error('Video session creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get video session for a booking
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

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      )
    }

    // Verify booking exists and user has access
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        tutor: {
          include: {
            user: true,
          },
        },
        student: true,
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Check authorization
    const isAuthorized =
      booking.studentId === session.user.id ||
      booking.tutor.userId === session.user.id ||
      session.user.role === 'ADMIN'

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Get video session
    const videoSession = await prisma.videoSession.findUnique({
      where: { bookingId },
    })

    if (!videoSession) {
      return NextResponse.json(
        { error: 'Video session not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      sessionToken: videoSession.sessionToken,
      sessionId: videoSession.id,
      status: videoSession.status,
      startedAt: videoSession.startedAt,
    })
  } catch (error) {
    console.error('Video session fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

