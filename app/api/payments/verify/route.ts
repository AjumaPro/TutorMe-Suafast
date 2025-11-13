import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-db'
import { createNotification } from '@/lib/notifications'
import crypto from 'crypto'

// Paystack initialization
const paystack = require('paystack')(process.env.PAYSTACK_SECRET_KEY || '')

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { reference, bookingId } = await request.json()

    if (!reference) {
      return NextResponse.json(
        { error: 'Payment reference is required' },
        { status: 400 }
      )
    }

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      )
    }

    // Verify payment with Paystack
    try {
      const response = await paystack.transaction.verify(reference)

      if (!response.status) {
        return NextResponse.json(
          { error: 'Payment verification failed', success: false },
          { status: 400 }
        )
      }

      const transaction = response.data

      // Check if payment was successful
      if (transaction.status !== 'success') {
        return NextResponse.json(
          { error: 'Payment was not successful', success: false },
          { status: 400 }
        )
      }

      // Get payment record
      const { data: payment } = await supabase
        .from('payments')
        .select('*')
        .eq('bookingId', bookingId)
        .single()

      if (!payment) {
        return NextResponse.json(
          { error: 'Payment record not found' },
          { status: 404 }
        )
      }

      // Verify the amount matches
      const expectedAmount = Math.round(payment.amount * 100) // Convert to pesewas (1 GHS = 100 pesewas)
      if (transaction.amount !== expectedAmount) {
        return NextResponse.json(
          { error: 'Payment amount mismatch', success: false },
          { status: 400 }
        )
      }

      const now = new Date().toISOString()
      const paidAt = transaction.paid_at ? new Date(transaction.paid_at).toISOString() : now

      // Update payment record
      await supabase
        .from('payments')
        .update({
          paystackPaymentId: transaction.id.toString(),
          paystackReference: reference,
          status: 'PAID',
          paidAt: paidAt,
          updatedAt: now,
        })
        .eq('id', payment.id)

      // Fetch booking and related data
      const { data: booking } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single()

      if (booking) {
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

        // Update booking status
        await supabase
          .from('bookings')
          .update({
            status: 'CONFIRMED',
            updatedAt: now,
          })
          .eq('id', bookingId)

        // If this is a recurring parent booking, also confirm all child bookings
        if (booking.isRecurring && !booking.parentBookingId) {
          await supabase
            .from('bookings')
            .update({
              status: 'CONFIRMED',
              updatedAt: now,
            })
            .eq('parentBookingId', booking.id)
          console.log('Confirmed all child bookings for recurring booking:', booking.id)
        }

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
            const sessionId = crypto.randomUUID()
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
          const scheduledAt = typeof booking.scheduledAt === 'string' 
            ? booking.scheduledAt 
            : new Date(booking.scheduledAt).toISOString()

          // Notification for parent (student)
          if (student) {
            await createNotification({
              userId: booking.studentId,
              type: 'PAYMENT_RECEIVED',
              title: 'Payment Successful - Booking Confirmed',
              message: `Your payment of ₵${payment.amount.toFixed(2)} for ${booking.subject} lesson has been confirmed. Your booking is now active!`,
              link: `/bookings/${booking.id}`,
              metadata: {
                bookingId: booking.id,
                amount: payment.amount,
                subject: booking.subject,
              },
            })
          }

          // Notification for tutor
          if (tutorUser) {
            await createNotification({
              userId: tutor.userId,
              type: 'BOOKING_CONFIRMED',
              title: 'New Booking Confirmed',
              message: `${student?.name || 'A student'} has confirmed and paid for a ${booking.subject} lesson scheduled for ${new Date(scheduledAt).toLocaleDateString()}.`,
              link: `/bookings/${booking.id}`,
              metadata: {
                bookingId: booking.id,
                studentName: student?.name || 'Unknown',
                subject: booking.subject,
                scheduledAt: scheduledAt,
              },
            })
          }

          console.log(`✅ Notifications sent to parent (${student?.email || 'N/A'}) and tutor (${tutorUser?.email || 'N/A'})`)
        } catch (notificationError) {
          console.error('Error sending notifications:', notificationError)
          // Don't fail the payment verification if notifications fail
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Payment verified successfully',
        transaction: {
          reference: transaction.reference,
          amount: transaction.amount / 100, // Convert back from pesewas to GHS
          status: transaction.status,
        },
      })
    } catch (paystackError: any) {
      console.error('Paystack verification error:', paystackError)
      return NextResponse.json(
        { error: paystackError.message || 'Payment verification failed', success: false },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    )
  }
}

