import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

const PLATFORM_FEE_PERCENTAGE = 0.15 // 15% commission

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { bookingId } = await request.json()

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      )
    }

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        tutor: true,
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    if (booking.studentId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (booking.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Booking is not pending payment' },
        { status: 400 }
      )
    }

    // Calculate fees
    const platformFee = booking.price * PLATFORM_FEE_PERCENTAGE
    const tutorPayout = booking.price - platformFee

    // Create or get payment record
    let payment = await prisma.payment.findUnique({
      where: { bookingId },
    })

    if (!payment) {
      payment = await prisma.payment.create({
        data: {
          bookingId: booking.id,
          amount: booking.price,
          platformFee,
          tutorPayout,
          status: 'PENDING',
        },
      })
    }

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(booking.price * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        bookingId: booking.id,
        paymentId: payment.id,
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentId: payment.id,
    })
  } catch (error) {
    console.error('Payment intent creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

