import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-db'
import { createNotification } from '@/lib/notifications'
import crypto from 'crypto'

// Paystack initialization
const paystack = require('paystack')(process.env.PAYSTACK_SECRET_KEY || '')

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-paystack-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY || '')
      .update(body)
      .digest('hex')

    if (hash !== signature) {
      console.error('Invalid Paystack webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    const event = JSON.parse(body)

    // Handle different event types
    if (event.event === 'charge.success') {
      const transaction = event.data

      // Find payment by reference
      const { data: payment } = await supabase
        .from('payments')
        .select('*')
        .eq('paystackReference', transaction.reference)
        .single()

      if (!payment) {
        console.error('Payment not found for reference:', transaction.reference)
        return NextResponse.json(
          { error: 'Payment not found' },
          { status: 404 }
        )
      }

      // Check if already processed
      if (payment.status === 'PAID') {
        return NextResponse.json({ received: true })
      }

      const now = new Date().toISOString()
      const paidAt = transaction.paid_at ? new Date(transaction.paid_at).toISOString() : now

      // Update payment record
      await supabase
        .from('payments')
        .update({
          paystackPaymentId: transaction.id.toString(),
          status: 'PAID',
          paidAt: paidAt,
          updatedAt: now,
        })
        .eq('id', payment.id)

      // Fetch booking
      const { data: booking } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', payment.bookingId)
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
          .eq('id', payment.bookingId)

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
              link: `/bookings/${payment.bookingId}`,
              metadata: {
                bookingId: payment.bookingId,
                amount: payment.amount,
                subject: booking.subject,
                scheduledAt: scheduledAt,
              },
            })
          }

          // Notification for tutor
          if (tutorUser) {
            await createNotification({
              userId: tutor.userId,
              type: 'BOOKING_CONFIRMED',
              title: 'New Booking Confirmed',
              message: `${student?.name || 'A student'} has confirmed and paid for a ${booking.subject} lesson scheduled for ${new Date(scheduledAt).toLocaleDateString()} at ${new Date(scheduledAt).toLocaleTimeString()}.`,
              link: `/bookings/${payment.bookingId}`,
              metadata: {
                bookingId: payment.bookingId,
                studentName: student?.name || 'Unknown',
                subject: booking.subject,
                scheduledAt: scheduledAt,
                amount: payment.amount,
              },
            })
          }

          console.log(`✅ Notifications sent to parent (${student?.email || 'N/A'}) and tutor (${tutorUser?.email || 'N/A'})`)
        } catch (notificationError) {
          console.error('Error sending notifications:', notificationError)
          // Don't fail the webhook if notifications fail
        }
      }

      return NextResponse.json({ received: true })
    }

    // Handle other events (charge.failed, etc.)
    if (event.event === 'charge.failed') {
      const transaction = event.data

      const { data: payment } = await supabase
        .from('payments')
        .select('*')
        .eq('paystackReference', transaction.reference)
        .single()

      if (payment && payment.status === 'PENDING') {
        await supabase
          .from('payments')
          .update({
            status: 'FAILED',
            updatedAt: new Date().toISOString(),
          })
          .eq('id', payment.id)
      }

      return NextResponse.json({ received: true })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

