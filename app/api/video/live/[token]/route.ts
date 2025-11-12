import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Get live session info by token (for students to join)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    const videoSession = await prisma.videoSession.findUnique({
      where: { sessionToken: token },
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
        booking: {
          include: {
            student: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    if (!videoSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    if (videoSession.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Session has ended' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      sessionId: videoSession.id,
      sessionToken: videoSession.sessionToken,
      subject: videoSession.subject,
      tutor: videoSession.tutor
        ? {
            name: videoSession.tutor.user.name,
            email: videoSession.tutor.user.email,
            image: videoSession.tutor.user.image,
          }
        : null,
      startedAt: videoSession.startedAt,
    })
  } catch (error) {
    console.error('Live session fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

