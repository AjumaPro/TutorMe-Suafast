import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-db'

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
    const { data: videoSession } = await supabase
      .from('video_sessions')
      .select('*')
      .eq('bookingId', id)
      .single()

    if (!videoSession) {
      return NextResponse.json(
        { error: 'Video session not found' },
        { status: 404 }
      )
    }

    // Fetch booking and related data
    let booking = null
    let tutor = null
    let tutorUser = null

    if (videoSession.bookingId) {
      const { data: bookingData } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', videoSession.bookingId)
        .single()

      booking = bookingData

      if (booking?.tutorId) {
        const { data: tutorData } = await supabase
          .from('tutor_profiles')
          .select('*')
          .eq('id', booking.tutorId)
          .single()

        tutor = tutorData

        if (tutor?.userId) {
          const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('id', tutor.userId)
            .single()

          tutorUser = userData
        }
      }
    }

    // Check authorization
    let isAuthorized = false

    if (booking) {
      // Booking-based session
      isAuthorized =
        booking.studentId === session.user.id ||
        (tutorUser && tutorUser.id === session.user.id) ||
        session.user.role === 'ADMIN'
    } else if (videoSession.tutorId) {
      // Ad-hoc session - check if user is the tutor
      const { data: tutorProfile } = await supabase
        .from('tutor_profiles')
        .select('id')
        .eq('userId', session.user.id)
        .single()

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
    const now = new Date().toISOString()
    const { error: updateError } = await supabase
      .from('video_sessions')
      .update({
        status: 'ENDED',
        endedAt: now,
        updatedAt: now,
      })
      .eq('bookingId', id)

    if (updateError) {
      console.error('Error updating video session:', updateError)
      return NextResponse.json(
        { error: 'Failed to end session' },
        { status: 500 }
      )
    }

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
