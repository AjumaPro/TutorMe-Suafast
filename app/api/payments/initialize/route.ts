import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-db'
import { getPaystackTransactionOptions } from '@/lib/paystack-config'
import { parseCurrencyCode, toSmallestUnit, DEFAULT_CURRENCY } from '@/lib/currency'
import crypto from 'crypto'

function uuidv4() {
  return crypto.randomUUID()
}

// Paystack initialization
const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY || ''
if (!paystackSecretKey) {
  console.error('⚠️ PAYSTACK_SECRET_KEY is not set in environment variables!')
}
const paystack = require('paystack')(paystackSecretKey)

const PLATFORM_FEE_PERCENTAGE = 0.20 // 20% service fee

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
    const { data: booking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()
    
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }
    
    // Fetch tutor and user data
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
          .select('email, name')
          .eq('id', tutor.userId)
          .single()
        tutorUser = userData
      }
    }
    
    // Fetch student data
    let student = null
    if (booking.studentId) {
      const { data: studentData } = await supabase
        .from('users')
        .select('email, name')
        .eq('id', booking.studentId)
        .single()
      student = studentData
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
        const { data: childBookings } = await supabase
          .from('bookings')
          .select('price')
          .eq('parentBookingId', booking.id)
        
        totalBookings = 1 + (childBookings?.length || 0)
        totalAmount = booking.price + (childBookings || []).reduce((sum: number, child: any) => sum + (child.price || 0), 0)
        
        console.log(`Recurring booking: ${totalBookings} lessons, total amount: ${totalAmount}`)
        console.log(`Parent booking price: ${booking.price}, Child bookings: ${childBookings?.length || 0}`)
      } catch (error) {
        console.error('Error fetching child bookings:', error)
        // Continue with parent booking price only if there's an error
        console.warn('Using parent booking price only due to error fetching child bookings')
      }
    }

    // Get currency from booking or tutor profile (default to GHS)
    const currency = parseCurrencyCode(booking.currency || tutor?.currency || DEFAULT_CURRENCY)

    // Calculate fees based on total amount
    const platformFee = totalAmount * PLATFORM_FEE_PERCENTAGE
    const tutorPayout = totalAmount - platformFee

    // Create or get payment record
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('*')
      .eq('bookingId', bookingId)
      .single()

    let payment = existingPayment

    if (!payment) {
      // Generate UUID for payment ID
      const paymentId = uuidv4()
      const now = new Date().toISOString()
      
      const { data: newPayment, error: createError } = await supabase
        .from('payments')
        .insert({
          id: paymentId,
          bookingId: booking.id,
          amount: totalAmount, // Store total amount for recurring bookings
          platformFee,
          tutorPayout,
          status: 'PENDING',
          currency: currency,
          createdAt: now,
          updatedAt: now,
        })
        .select()
        .single()
      
      if (createError) throw createError
      payment = newPayment
    } else if (payment.amount !== totalAmount) {
      // Update payment amount if it changed (shouldn't happen, but just in case)
      const { data: updatedPayment, error: updateError } = await supabase
        .from('payments')
        .update({
          amount: totalAmount,
          platformFee,
          tutorPayout,
          currency: currency,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', payment.id)
        .select()
        .single()
      
      if (updateError) throw updateError
      payment = updatedPayment
    }

    // Generate unique reference
    const reference = `TUTORME_${booking.id}_${Date.now()}`

    // Initialize Paystack transaction
    // Convert amount to smallest currency unit (pesewas for GHS, cents for USD, etc.)
    const amountInSmallestUnit = toSmallestUnit(totalAmount, currency)

    try {
      // Get configured Paystack transaction options
      const transactionOptions = getPaystackTransactionOptions({
        email: student?.email || session.user.email || '',
        amount: amountInSmallestUnit,
        reference,
        currency: currency,
        metadata: {
          bookingId: booking.id,
          paymentId: payment.id,
          studentName: student?.name || 'Unknown Student',
          tutorName: tutorUser?.name || 'Unknown Tutor',
          subject: booking.subject,
          lessonType: booking.lessonType,
          scheduledAt: typeof booking.scheduledAt === 'string' ? booking.scheduledAt : new Date(booking.scheduledAt).toISOString(),
          duration: booking.duration.toString(),
          isRecurring: booking.isRecurring ? 'true' : 'false',
          totalBookings: totalBookings.toString(),
          totalAmount: totalAmount.toString(),
        },
        callbackUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/bookings/${booking.id}?payment=success&reference=${reference}`,
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
      await supabase
        .from('payments')
        .update({
          paystackReference: reference,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', payment.id)

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

