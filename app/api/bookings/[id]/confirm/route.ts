import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-db'
import { createNotification } from '@/lib/notifications'
import crypto from 'crypto'

function uuidv4() {
  return crypto.randomUUID()
}

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
    
    // Fetch booking
    const { data: booking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single()
    
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }
    
    // Fetch payment
    const { data: payment } = await supabase
      .from('payments')
      .select('*')
      .eq('bookingId', booking.id)
      .single()
    
    // Fetch student
    const { data: student } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', booking.studentId)
      .single()
    
    // Fetch tutor and user
    let tutor = null
    let tutorUser = null
    if (booking.tutorId) {
      const { data: tutorData } = await supabase
        .from('tutor_profiles')
        .select('*')
        .eq('id', booking.tutorId)
        .single()
      tutor = tutorData
      
      if (tutor?.userId) {
        const { data: userData } = await supabase
          .from('users')
          .select('id, name, email')
          .eq('id', tutor.userId)
          .single()
        tutorUser = userData
      }
    }
    
    booking.payment = payment || null
    booking.student = student || null
    booking.tutor = tutor ? { ...tutor, user: tutorUser } : null

    if (booking.studentId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const now = new Date().toISOString()
    
    // Update payment status
    if (booking.payment) {
      await supabase
        .from('payments')
        .update({
          status: 'PAID',
          paidAt: now,
          updatedAt: now,
        })
        .eq('id', booking.payment.id)
    }

    // Update booking status
    await supabase
      .from('bookings')
      .update({
        status: 'CONFIRMED',
        updatedAt: now,
      })
      .eq('id', booking.id)

    // Create video session for online lessons
    if (booking.lessonType === 'ONLINE') {
      const { randomBytes } = await import('crypto')
      const sessionToken = randomBytes(32).toString('hex')
      
      // Check if video session exists
      const { data: existingSession } = await supabase
        .from('video_sessions')
        .select('*')
        .eq('bookingId', booking.id)
        .single()
      
      if (existingSession) {
        await supabase
          .from('video_sessions')
          .update({
            sessionToken,
            status: 'ACTIVE',
            updatedAt: now,
          })
          .eq('id', existingSession.id)
      } else {
        const sessionId = uuidv4()
        await supabase
          .from('video_sessions')
          .insert({
            id: sessionId,
            bookingId: booking.id,
            sessionToken,
            status: 'ACTIVE',
            createdAt: now,
            updatedAt: now,
          })
      }
    }

    // Send notifications to both parent and tutor
    try {
      const paymentAmount = booking.payment?.amount || booking.price
      const paymentStatus = booking.payment?.status || 'PAID'
      const scheduledAt = typeof booking.scheduledAt === 'string' 
        ? booking.scheduledAt 
        : new Date(booking.scheduledAt).toISOString()

      // Notification for parent (student)
      if (booking.student) {
        await createNotification({
          userId: booking.studentId,
          type: 'BOOKING_CONFIRMED',
          title: 'Booking Confirmed',
          message: `Your ${booking.subject} lesson has been confirmed${paymentStatus === 'PAID' ? ` and payment of ₵${paymentAmount.toFixed(2)} has been received` : ''}.`,
          link: `/bookings/${booking.id}`,
          metadata: {
            bookingId: booking.id,
            subject: booking.subject,
            scheduledAt: scheduledAt,
            lessonType: booking.lessonType,
          },
        })
      }

      // Notification for tutor
      if (booking.tutor?.user) {
        await createNotification({
          userId: booking.tutor.userId,
          type: 'BOOKING_CONFIRMED',
          title: 'New Booking Confirmed',
          message: `${booking.student?.name || 'A student'} has confirmed a ${booking.subject} lesson scheduled for ${new Date(scheduledAt).toLocaleDateString()} at ${new Date(scheduledAt).toLocaleTimeString()}.`,
          link: `/bookings/${booking.id}`,
          metadata: {
            bookingId: booking.id,
            studentName: booking.student?.name || 'Unknown',
            subject: booking.subject,
            scheduledAt: scheduledAt,
            lessonType: booking.lessonType,
          },
        })
      }

      console.log(`✅ Notifications sent to parent (${booking.student?.email || 'N/A'}) and tutor (${booking.tutor?.user?.email || 'N/A'})`)
    } catch (notificationError) {
      console.error('Error sending notifications:', notificationError)
      // Don't fail the confirmation if notifications fail
    }

    return NextResponse.json(
      { message: 'Booking confirmed successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Booking confirmation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

