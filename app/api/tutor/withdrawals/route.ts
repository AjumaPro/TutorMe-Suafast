import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-db'
import { parseCurrencyCode, DEFAULT_CURRENCY } from '@/lib/currency'
import { z } from 'zod'

const MINIMUM_WITHDRAWAL_AMOUNT = 100 // 100 GHS minimum

const withdrawalRequestSchema = z.object({
  amount: z.number().min(MINIMUM_WITHDRAWAL_AMOUNT, `Minimum withdrawal amount is ${MINIMUM_WITHDRAWAL_AMOUNT} GHS`),
  frequency: z.enum(['WEEKLY', 'MONTHLY']),
  paymentMethod: z.string().optional(),
  accountDetails: z.string().optional(),
})

// Get tutor's withdrawal requests
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TUTOR') {
      return NextResponse.json(
        { error: 'Unauthorized. Tutor access required.' },
        { status: 401 }
      )
    }

    // Get tutor profile
    const { data: tutorProfile } = await supabase
      .from('tutor_profiles')
      .select('id')
      .eq('userId', session.user.id)
      .single()

    if (!tutorProfile) {
      return NextResponse.json(
        { error: 'Tutor profile not found' },
        { status: 404 }
      )
    }

    // Fetch withdrawal requests
    const { data: withdrawals, error } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('tutorId', tutorProfile.id)
      .order('requestedAt', { ascending: false })

    if (error) {
      console.error('Error fetching withdrawals:', error)
      return NextResponse.json(
        { error: 'Failed to fetch withdrawal requests' },
        { status: 500 }
      )
    }

    return NextResponse.json({ withdrawals: withdrawals || [] }, { status: 200 })
  } catch (error) {
    console.error('Withdrawal fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Create withdrawal request
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TUTOR') {
      return NextResponse.json(
        { error: 'Unauthorized. Tutor access required.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = withdrawalRequestSchema.parse(body)

    // Get tutor profile
    const { data: tutorProfile } = await supabase
      .from('tutor_profiles')
      .select('id, currency')
      .eq('userId', session.user.id)
      .single()

    if (!tutorProfile) {
      return NextResponse.json(
        { error: 'Tutor profile not found' },
        { status: 404 }
      )
    }

    // Get currency
    const currency = parseCurrencyCode(validatedData.amount >= MINIMUM_WITHDRAWAL_AMOUNT 
      ? (tutorProfile.currency || DEFAULT_CURRENCY)
      : DEFAULT_CURRENCY)

    // Check if amount meets minimum (convert if needed for other currencies)
    // For now, we'll assume GHS as base currency
    if (currency !== 'GHS') {
      // TODO: Add currency conversion if needed
      return NextResponse.json(
        { error: 'Withdrawals currently only supported in GHS' },
        { status: 400 }
      )
    }

    if (validatedData.amount < MINIMUM_WITHDRAWAL_AMOUNT) {
      return NextResponse.json(
        { error: `Minimum withdrawal amount is ${MINIMUM_WITHDRAWAL_AMOUNT} GHS` },
        { status: 400 }
      )
    }

    // Check available balance (get total earnings minus previous withdrawals)
    const { data: bookingsData } = await supabase
      .from('bookings')
      .select('id')
      .eq('tutorId', tutorProfile.id)

    const bookingIds = bookingsData?.map((b: any) => b.id) || []
    let availableBalance = 0

    if (bookingIds.length > 0) {
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('tutorPayout, status')
        .in('bookingId', bookingIds)
        .eq('status', 'PAID')

      availableBalance = (paymentsData || []).reduce(
        (sum: number, p: any) => sum + (p.tutorPayout || 0),
        0
      )
    }

    // Get total approved/processing withdrawals
    const { data: existingWithdrawals } = await supabase
      .from('withdrawal_requests')
      .select('amount')
      .eq('tutorId', tutorProfile.id)
      .in('status', ['PENDING', 'APPROVED', 'PROCESSING'])

    const pendingWithdrawals = (existingWithdrawals || []).reduce(
      (sum: number, w: any) => sum + (w.amount || 0),
      0
    )

    const availableForWithdrawal = availableBalance - pendingWithdrawals

    if (validatedData.amount > availableForWithdrawal) {
      return NextResponse.json(
        { 
          error: `Insufficient balance. Available: ${availableForWithdrawal.toFixed(2)} GHS`,
          availableBalance: availableForWithdrawal
        },
        { status: 400 }
      )
    }

    // Check frequency restrictions
    const now = new Date()
    let startDate: Date
    if (validatedData.frequency === 'WEEKLY') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // Check if there's already a withdrawal request in this period
    const { data: recentWithdrawals } = await supabase
      .from('withdrawal_requests')
      .select('id')
      .eq('tutorId', tutorProfile.id)
      .eq('frequency', validatedData.frequency)
      .gte('requestedAt', startDate.toISOString())
      .in('status', ['PENDING', 'APPROVED', 'PROCESSING'])

    if (recentWithdrawals && recentWithdrawals.length > 0) {
      const frequencyText = validatedData.frequency === 'WEEKLY' ? 'weekly' : 'monthly'
      return NextResponse.json(
        { error: `You already have a pending ${frequencyText} withdrawal request` },
        { status: 400 }
      )
    }

    // Create withdrawal request
    const withdrawalData = {
      tutorId: tutorProfile.id,
      amount: validatedData.amount,
      currency: currency,
      frequency: validatedData.frequency,
      status: 'PENDING',
      paymentMethod: validatedData.paymentMethod || null,
      accountDetails: validatedData.accountDetails || null,
      requestedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const { data: withdrawal, error: createError } = await supabase
      .from('withdrawal_requests')
      .insert(withdrawalData)
      .select()
      .single()

    if (createError) {
      console.error('Error creating withdrawal request:', createError)
      return NextResponse.json(
        { error: 'Failed to create withdrawal request' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message: 'Withdrawal request submitted successfully',
        withdrawal,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Withdrawal request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

