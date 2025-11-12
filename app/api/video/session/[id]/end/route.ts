import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// End a video session
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Get video session by booking ID
    const videoSession = await prisma.videoSession.findUnique({
      where: { bookingId: id },
      include: {
        booking: {
          include: {
            tutor: {
              include: {
                user: true,
              },
            },
            student: true,
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

    // Check authorization
    let isAuthorized = false

    if (videoSession.booking) {
      // Booking-based session
      isAuthorized =
        videoSession.booking.studentId === session.user.id ||
        videoSession.booking.tutor.userId === session.user.id ||
        session.user.role === 'ADMIN'
    } else if (videoSession.tutorId) {
      // Ad-hoc session - check if user is the tutor
      const tutorProfile = await prisma.tutorProfile.findUnique({
        where: { userId: session.user.id },
      })
      isAuthorized =
        (tutorProfile && tutorProfile.id === videoSession.tutorId) ||
        session.user.role === 'ADMIN'
    } else {
      // Fallback to admin only
      isAuthorized = session.user.role === 'ADMIN'
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Update session status
    await prisma.videoSession.update({
      where: { bookingId: id },
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

