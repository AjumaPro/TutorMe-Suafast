import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPaystackTransactionOptions } from '@/lib/paystack-config'

// Paystack initialization
const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY || ''
if (!paystackSecretKey) {
  console.error('⚠️ PAYSTACK_SECRET_KEY is not set in environment variables!')
}
const paystack = require('paystack')(paystackSecretKey)

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
        tutor: {
          include: {
            user: {
              select: {
                email: true,
                name: true,
              },
            },
          },
        },
        student: {
          select: {
            email: true,
            name: true,
          },
        },
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

    // For recurring bookings, calculate total from all related bookings
    let totalAmount = booking.price
    let totalBookings = 1
    
    if (booking.isRecurring && !booking.parentBookingId) {
      // This is a parent recurring booking - get all child bookings
      try {
        const childBookings = await prisma.booking.findMany({
          where: { parentBookingId: booking.id },
          select: { price: true },
        })
        
        totalBookings = 1 + childBookings.length
        totalAmount = booking.price + childBookings.reduce((sum, child) => sum + child.price, 0)
        
        console.log(`Recurring booking: ${totalBookings} lessons, total amount: ${totalAmount}`)
        console.log(`Parent booking price: ${booking.price}, Child bookings: ${childBookings.length}`)
      } catch (error) {
        console.error('Error fetching child bookings:', error)
        // Continue with parent booking price only if there's an error
        console.warn('Using parent booking price only due to error fetching child bookings')
      }
    }

    // Calculate fees based on total amount
    const platformFee = totalAmount * PLATFORM_FEE_PERCENTAGE
    const tutorPayout = totalAmount - platformFee

    // Create or get payment record
    let payment = await prisma.payment.findUnique({
      where: { bookingId },
    })

    if (!payment) {
      payment = await prisma.payment.create({
        data: {
          bookingId: booking.id,
          amount: totalAmount, // Store total amount for recurring bookings
          platformFee,
          tutorPayout,
          status: 'PENDING',
        },
      })
    } else if (payment.amount !== totalAmount) {
      // Update payment amount if it changed (shouldn't happen, but just in case)
      payment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          amount: totalAmount,
          platformFee,
          tutorPayout,
        },
      })
    }

    // Generate unique reference
    const reference = `TUTORME_${booking.id}_${Date.now()}`

    // Initialize Paystack transaction
    // Amount in pesewas (smallest currency unit for GHS)
    // 1 GHS = 100 pesewas (similar to cents/kobo)
    const amountInPesewas = Math.round(totalAmount * 100)

    try {
      // Get configured Paystack transaction options
      const transactionOptions = getPaystackTransactionOptions({
        email: booking.student.email,
        amount: amountInPesewas,
        reference,
        currency: 'GHS', // Ghana Cedis
        metadata: {
          bookingId: booking.id,
          paymentId: payment.id,
          studentName: booking.student.name,
          tutorName: booking.tutor.user.name,
          subject: booking.subject,
          lessonType: booking.lessonType,
          scheduledAt: booking.scheduledAt.toISOString(),
          duration: booking.duration.toString(),
          isRecurring: booking.isRecurring ? 'true' : 'false',
          totalBookings: totalBookings.toString(),
          totalAmount: totalAmount.toString(),
        },
        callbackUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/bookings/${booking.id}?payment=success`,
      })

      console.log('Initializing Paystack transaction with options:', {
        email: transactionOptions.email,
        amount: transactionOptions.amount,
        reference: transactionOptions.reference,
        currency: transactionOptions.currency,
        hasSecretKey: !!paystackSecretKey,
        secretKeyPrefix: paystackSecretKey ? paystackSecretKey.substring(0, 7) + '...' : 'MISSING',
      })

      const response = await paystack.transaction.initialize(transactionOptions)

      console.log('Paystack response:', {
        status: response.status,
        hasData: !!response.data,
        accessCode: response.data?.access_code,
        authorizationUrl: response.data?.authorization_url,
        fullResponse: JSON.stringify(response, null, 2),
      })

      // Handle Paystack response - check both status and data
      if (!response) {
        console.error('No response from Paystack')
        return NextResponse.json(
          { error: 'No response from Paystack. Please try again.' },
          { status: 500 }
        )
      }

      // Check if response has status property (Paystack returns { status: true, data: {...} })
      if (response.status === false) {
        console.error('Paystack returned error status:', response)
        return NextResponse.json(
          { error: response.message || 'Paystack initialization failed. Please try again.' },
          { status: 500 }
        )
      }

      if (!response.data) {
        console.error('No data in Paystack response:', response)
        return NextResponse.json(
          { error: 'Invalid response from Paystack. Please try again.' },
          { status: 500 }
        )
      }

      // Check for required fields
      if (!response.data.access_code) {
        console.error('Missing access_code in Paystack response:', response.data)
        return NextResponse.json(
          { error: 'Payment initialization incomplete. Missing access code.' },
          { status: 500 }
        )
      }

      // authorization_url is required for redirect
      if (!response.data.authorization_url) {
        console.error('Missing authorization_url in Paystack response:', response.data)
        // Try to construct it from access_code
        if (response.data.access_code) {
          response.data.authorization_url = `https://checkout.paystack.com/${response.data.access_code}`
          console.log('Constructed authorization URL from access code')
        } else {
          return NextResponse.json(
            { error: 'Payment initialization incomplete. Missing authorization URL.' },
            { status: 500 }
          )
        }
      }

      // Update payment with reference
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          paystackReference: reference,
        },
      })

      return NextResponse.json({
        reference,
        accessCode: response.data.access_code,
        authorizationUrl: response.data.authorization_url,
        paymentId: payment.id,
      })
    } catch (paystackError: any) {
      console.error('Paystack initialization error:', {
        message: paystackError.message,
        error: paystackError,
        stack: paystackError.stack,
      })
      return NextResponse.json(
        { 
          error: paystackError.message || 'Failed to initialize payment',
          details: process.env.NODE_ENV === 'development' ? paystackError.toString() : undefined
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Payment initialization error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

