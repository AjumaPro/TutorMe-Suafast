import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-db'
import { randomBytes } from 'crypto'
import crypto from 'crypto'

function uuidv4() {
  return crypto.randomUUID()
}

// Create or get video session for a booking (TUTOR ONLY)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only tutors can start video sessions
    if (session.user.role !== 'TUTOR') {
      return NextResponse.json(
        { error: 'Only tutors can start video sessions' },
        { status: 403 }
      )
    }

    const { bookingId } = await request.json()

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      )
    }

    // Verify booking exists and tutor has access
    const { data: booking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Fetch tutor profile to verify ownership
    const { data: tutorProfile } = await supabase
      .from('tutor_profiles')
      .select('id, userId')
      .eq('userId', session.user.id)
      .single()

    if (!tutorProfile || tutorProfile.id !== booking.tutorId) {
      return NextResponse.json(
        { error: 'Unauthorized - You can only start sessions for your own bookings' },
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
    const { data: existingSession } = await supabase
      .from('video_sessions')
      .select('*')
      .eq('bookingId', bookingId)
      .single()

    if (existingSession) {
      return NextResponse.json({
        sessionToken: existingSession.sessionToken,
        sessionId: existingSession.id,
        status: existingSession.status,
      })
    }

    // Generate unique session token
    const sessionToken = randomBytes(32).toString('hex')
    const now = new Date().toISOString()
    const sessionId = uuidv4()

    // Create new video session
    const { data: videoSession, error: createError } = await supabase
      .from('video_sessions')
      .insert({
        id: sessionId,
        bookingId,
        sessionToken,
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating video session:', createError)
      return NextResponse.json(
        { error: 'Failed to create video session' },
        { status: 500 }
      )
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
    const { data: booking } = await supabase
      .from('bookings')
      .select('studentId, tutorId')
      .eq('id', bookingId)
      .single()

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Fetch tutor to check userId
    let tutorUserId = null
    if (booking.tutorId) {
      const { data: tutor } = await supabase
        .from('tutor_profiles')
        .select('userId')
        .eq('id', booking.tutorId)
        .single()

      tutorUserId = tutor?.userId
    }

    // Check authorization
    const isAuthorized =
      booking.studentId === session.user.id ||
      (tutorUserId === session.user.id) ||
      session.user.role === 'ADMIN'

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Get video session
    const { data: videoSession } = await supabase
      .from('video_sessions')
      .select('*')
      .eq('bookingId', bookingId)
      .single()

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
