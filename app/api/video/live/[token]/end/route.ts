import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// End a live session
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { token } = await params

    // Get video session
    const videoSession = await prisma.videoSession.findUnique({
      where: { sessionToken: token },
      include: {
        tutor: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!videoSession) {
      return NextResponse.json(
        { error: 'Video session not found' },
        { status: 404 }
      )
    }

    // Check authorization - only tutor who started it can end it
    if (videoSession.tutorId) {
      const tutorProfile = await prisma.tutorProfile.findUnique({
        where: { userId: session.user.id },
      })

      if (!tutorProfile || tutorProfile.id !== videoSession.tutorId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        )
      }
    } else if (videoSession.bookingId) {
      // For booking-based sessions, check if user is authorized
      const booking = await prisma.booking.findUnique({
        where: { id: videoSession.bookingId },
        include: {
          tutor: {
            include: {
              user: true,
            },
          },
        },
      })

      if (!booking) {
        return NextResponse.json(
          { error: 'Booking not found' },
          { status: 404 }
        )
      }

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
    }

    // Update session status
    await prisma.videoSession.update({
      where: { sessionToken: token },
      data: {
        status: 'ENDED',
        endedAt: new Date(),
      },
    })

    return NextResponse.json({
      message: 'Video session ended successfully',
    })
  } catch (error) {
    console.error('Video session end error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

