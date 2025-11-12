import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
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
      const payment = await prisma.payment.findUnique({
        where: { paystackReference: transaction.reference },
        include: {
          booking: {
            include: {
              tutor: {
                include: {
                  user: {
                    select: {
                      id: true,
                    },
                  },
                },
              },
            },
          },
        },
      })

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

      // Update payment record
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          paystackPaymentId: transaction.id.toString(),
          status: 'PAID',
          paidAt: new Date(transaction.paid_at || new Date()),
        },
      })

      // Update booking status
      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: {
          status: 'CONFIRMED',
        },
      })

      // If this is a recurring parent booking, also confirm all child bookings
      if (payment.booking.isRecurring && !payment.booking.parentBookingId) {
        await prisma.booking.updateMany({
          where: { parentBookingId: payment.bookingId },
          data: {
            status: 'CONFIRMED',
          },
        })
        console.log('Confirmed all child bookings for recurring booking:', payment.bookingId)
      }

      // Create video session for online lessons
      if (payment.booking.lessonType === 'ONLINE') {
        const { randomBytes } = await import('crypto')
        const sessionToken = randomBytes(32).toString('hex')

        await prisma.videoSession.upsert({
          where: { bookingId: payment.bookingId },
          create: {
            bookingId: payment.bookingId,
            sessionToken,
            status: 'ACTIVE',
          },
          update: {
            status: 'ACTIVE',
          },
        })
      }

      // Create notification for student
      await prisma.notification.create({
        data: {
          userId: payment.booking.studentId,
          type: 'PAYMENT_RECEIVED',
          title: 'Payment Successful',
          message: `Your payment of ₵${payment.amount.toFixed(2)} for ${payment.booking.subject} lesson has been confirmed.`,
          link: `/bookings/${payment.bookingId}`,
        },
      })

      // Create notification for tutor
      await prisma.notification.create({
        data: {
          userId: payment.booking.tutor.userId,
          type: 'BOOKING_CONFIRMED',
          title: 'New Booking Confirmed',
          message: `A new ${payment.booking.subject} lesson has been booked and paid for.`,
          link: `/tutor/bookings/${payment.bookingId}`,
        },
      })

      return NextResponse.json({ received: true })
    }

    // Handle other events (charge.failed, etc.)
    if (event.event === 'charge.failed') {
      const transaction = event.data

      const payment = await prisma.payment.findUnique({
        where: { paystackReference: transaction.reference },
      })

      if (payment && payment.status === 'PENDING') {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'FAILED',
          },
        })
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

