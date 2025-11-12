import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
      const payment = await prisma.payment.findUnique({
        where: { bookingId },
      })

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

      // Update payment record
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          paystackPaymentId: transaction.id.toString(),
          paystackReference: reference,
          status: 'PAID',
          paidAt: new Date(transaction.paid_at || new Date()),
        },
      })

      // Update booking status
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
      })

      if (booking) {
        await prisma.booking.update({
          where: { id: bookingId },
          data: {
            status: 'CONFIRMED',
          },
        })

        // If this is a recurring parent booking, also confirm all child bookings
        if (booking.isRecurring && !booking.parentBookingId) {
          await prisma.booking.updateMany({
            where: { parentBookingId: booking.id },
            data: {
              status: 'CONFIRMED',
            },
          })
          console.log('Confirmed all child bookings for recurring booking:', booking.id)
        }
      }

      // Create video session for online lessons (booking already fetched above)
      if (booking && booking.lessonType === 'ONLINE') {
        const { randomBytes } = await import('crypto')
        const sessionToken = randomBytes(32).toString('hex')

        await prisma.videoSession.upsert({
          where: { bookingId: booking.id },
          create: {
            bookingId: booking.id,
            sessionToken,
            status: 'ACTIVE',
          },
          update: {
            status: 'ACTIVE',
          },
        })
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

