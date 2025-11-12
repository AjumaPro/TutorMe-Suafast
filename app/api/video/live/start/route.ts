import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'
import { z } from 'zod'

const startSessionSchema = z.object({
  subject: z.string().optional(),
})

// Start a live session (for tutors)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'TUTOR') {
      return NextResponse.json(
        { error: 'Only tutors can start live sessions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { subject } = startSessionSchema.parse(body)

    // Get tutor profile
    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!tutorProfile || !tutorProfile.isApproved) {
      return NextResponse.json(
        { error: 'Tutor profile not found or not approved' },
        { status: 404 }
      )
    }

    // Generate unique session token
    const sessionToken = randomBytes(32).toString('hex')

    // Create new live session
    const videoSession = await prisma.videoSession.create({
      data: {
        tutorId: tutorProfile.id,
        sessionToken,
        status: 'ACTIVE',
        subject: subject || null,
      },
    })

    // Generate join link
    const joinLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/join/${sessionToken}`

    return NextResponse.json({
      sessionId: videoSession.id,
      sessionToken: videoSession.sessionToken,
      joinLink,
      status: videoSession.status,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Live session creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

