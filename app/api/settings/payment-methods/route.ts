import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Paystack handles payment methods through their checkout page
    // Users can save cards during payment, but we don't store them directly
    // Payment methods are managed through Paystack's system
    // For now, we'll return an empty array as payment methods are handled by Paystack
    return NextResponse.json({
      paymentMethods: [],
      message: 'Payment methods are managed through Paystack. They are saved automatically when you make payments.',
    })
  } catch (error) {
    console.error('Payment methods fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Payment methods are managed through Paystack
    // Updates are handled through Paystack's checkout and customer management
    return NextResponse.json({
      message: 'Payment methods are managed through Paystack checkout',
    })
  } catch (error) {
    console.error('Payment method update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Payment methods are managed through Paystack
    // Deletion should be handled through Paystack dashboard or customer portal
    return NextResponse.json({
      message: 'Payment methods are managed through Paystack. Please contact support to remove saved payment methods.',
    })
  } catch (error) {
    console.error('Payment method delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

