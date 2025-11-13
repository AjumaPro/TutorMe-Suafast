import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-db'

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
    const { data: videoSession } = await supabase
      .from('video_sessions')
      .select('*')
      .eq('sessionToken', token)
      .single()

    if (!videoSession) {
      return NextResponse.json(
        { error: 'Video session not found' },
        { status: 404 }
      )
    }

    // Check authorization - only tutor who started it can end it
    if (videoSession.tutorId) {
      const { data: tutorProfile } = await supabase
        .from('tutor_profiles')
        .select('id')
        .eq('userId', session.user.id)
        .single()

      if (!tutorProfile || tutorProfile.id !== videoSession.tutorId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        )
      }
    } else if (videoSession.bookingId) {
      // For booking-based sessions, check if user is authorized
      const { data: booking } = await supabase
        .from('bookings')
        .select('studentId, tutorId')
        .eq('id', videoSession.bookingId)
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
      .eq('sessionToken', token)

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
