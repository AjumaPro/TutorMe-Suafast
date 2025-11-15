import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-db'
import { z } from 'zod'

const acceptSchema = z.object({
  accepted: z.boolean(),
})

// Tutor can accept or reject a booking
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TUTOR') {
      return NextResponse.json(
        { error: 'Unauthorized. Only tutors can accept bookings.' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { accepted } = acceptSchema.parse(body)

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

    // Verify tutor owns this booking
    const { data: tutorProfile } = await supabase
      .from('tutor_profiles')
      .select('*')
      .eq('userId', session.user.id)
      .single()

    if (!tutorProfile || booking.tutorId !== tutorProfile.id) {
      return NextResponse.json(
        { error: 'Unauthorized. This booking does not belong to you.' },
        { status: 403 }
      )
    }

    // Only allow accepting/rejecting PENDING bookings
    if (booking.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Cannot ${accepted ? 'accept' : 'reject'} booking with status: ${booking.status}` },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()
    const newStatus = accepted ? 'CONFIRMED' : 'CANCELLED'

    // Update booking status
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        status: newStatus,
        updatedAt: now,
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating booking:', updateError)
      return NextResponse.json(
        { error: 'Failed to update booking' },
        { status: 500 }
      )
    }

    // If this is a group class parent booking, update all child bookings
    if (booking.isGroupClass && booking.groupClassId === booking.id) {
      const { error: groupUpdateError } = await supabase
        .from('bookings')
        .update({
          status: newStatus,
          updatedAt: now,
        })
        .eq('groupClassId', id)
        .neq('id', id) // Don't update the parent itself again

      if (groupUpdateError) {
        console.error('Error updating group class bookings:', groupUpdateError)
        // Continue anyway, parent booking is updated
      }
    }

    // If this is a child booking in a group class, check if we should update parent
    if (booking.isGroupClass && booking.groupClassId && booking.groupClassId !== booking.id) {
      // If rejecting, just update this one
      // If accepting, check if parent should be auto-confirmed (when all children are accepted)
      if (accepted) {
        // Count pending child bookings
        const { count: pendingCount } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('groupClassId', booking.groupClassId)
          .eq('status', 'PENDING')
          .neq('id', booking.groupClassId) // Exclude parent

        // If no pending children, auto-confirm parent
        if (pendingCount === 0) {
          await supabase
            .from('bookings')
            .update({
              status: 'CONFIRMED',
              updatedAt: now,
            })
            .eq('id', booking.groupClassId)
        }
      }
    }

    // Create notification for student(s)
    if (booking.studentId) {
      const notificationData = {
        userId: booking.studentId,
        type: accepted ? 'BOOKING_CONFIRMED' : 'BOOKING_REJECTED',
        title: accepted ? 'Booking Confirmed' : 'Booking Rejected',
        message: accepted
          ? `Your booking for ${booking.subject} has been confirmed by the tutor.`
          : `Your booking for ${booking.subject} has been rejected by the tutor.`,
        link: `/bookings/${id}`,
        createdAt: now,
      }

      await supabase.from('notifications').insert(notificationData)
    }

    return NextResponse.json(
      { 
        message: `Booking ${accepted ? 'accepted' : 'rejected'} successfully`,
        booking: updatedBooking 
      },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Booking accept/reject error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

