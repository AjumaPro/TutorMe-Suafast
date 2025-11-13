import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-db'

// Get live session info by token (for students to join)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    const { data: videoSession } = await supabase
      .from('video_sessions')
      .select('*')
      .eq('sessionToken', token)
      .single()

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

    // Fetch tutor and user data
    let tutor = null
    let tutorUser = null
    if (videoSession.tutorId) {
      const { data: tutorData } = await supabase
        .from('tutor_profiles')
        .select('*')
        .eq('id', videoSession.tutorId)
        .single()
      tutor = tutorData

      if (tutor?.userId) {
        const { data: userData } = await supabase
          .from('users')
          .select('name, email, image')
          .eq('id', tutor.userId)
          .single()
        tutorUser = userData
      }
    }

    // Fetch booking and student data
    let student = null
    if (videoSession.bookingId) {
      const { data: booking } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', videoSession.bookingId)
        .single()

      if (booking?.studentId) {
        const { data: studentData } = await supabase
          .from('users')
          .select('name, email')
          .eq('id', booking.studentId)
          .single()
        student = studentData
      }
    }

    return NextResponse.json({
      sessionId: videoSession.id,
      sessionToken: videoSession.sessionToken,
      subject: videoSession.subject,
      tutor: tutorUser
        ? {
            name: tutorUser.name,
            email: tutorUser.email,
            image: tutorUser.image,
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

