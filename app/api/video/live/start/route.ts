import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-db'
import { randomBytes } from 'crypto'
import { z } from 'zod'
import crypto from 'crypto'

function uuidv4() {
  return crypto.randomUUID()
}

const startSessionSchema = z.object({
  subject: z.string().optional(),
})

// Start a live session (for tutors only)
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
    const { data: tutorProfile } = await supabase
      .from('tutor_profiles')
      .select('id, isApproved')
      .eq('userId', session.user.id)
      .single()

    if (!tutorProfile || !tutorProfile.isApproved) {
      return NextResponse.json(
        { error: 'Tutor profile not found or not approved' },
        { status: 404 }
      )
    }

    // Generate unique session token
    const sessionToken = randomBytes(32).toString('hex')
    const now = new Date().toISOString()
    const sessionId = uuidv4()

    // Create new live session
    const { data: videoSession, error: createError } = await supabase
      .from('video_sessions')
      .insert({
        id: sessionId,
        tutorId: tutorProfile.id,
        sessionToken,
        status: 'ACTIVE',
        subject: subject || null,
        startedAt: now,
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating live session:', createError)
      return NextResponse.json(
        { error: 'Failed to create live session' },
        { status: 500 }
      )
    }

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
