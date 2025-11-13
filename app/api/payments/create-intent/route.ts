import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * This endpoint is deprecated - we use Paystack instead of Stripe
 * All payment initialization should use /api/payments/initialize
 * This file is kept for backward compatibility but redirects to Paystack flow
 */
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

    // Redirect to Paystack payment initialization
    // This endpoint is deprecated - use /api/payments/initialize instead
    return NextResponse.json(
      { 
        error: 'This endpoint is deprecated. Please use /api/payments/initialize for Paystack payments.',
        redirectTo: `/api/payments/initialize`
      },
      { status: 410 } // 410 Gone - indicates resource is no longer available
    )
  } catch (error) {
    console.error('Payment intent creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
