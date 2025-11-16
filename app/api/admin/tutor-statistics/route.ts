import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-db'
import { parseCurrencyCode, DEFAULT_CURRENCY } from '@/lib/currency'

// Get tutor statistics aggregated by time period
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'daily' // daily, weekly, monthly
    const tutorId = searchParams.get('tutorId') // Optional: filter by specific tutor
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build query for bookings
    let bookingsQuery = supabase
      .from('bookings')
      .select('id, tutorId, price, currency, status, scheduledAt, createdAt')

    if (tutorId) {
      bookingsQuery = bookingsQuery.eq('tutorId', tutorId)
    }

    if (startDate) {
      bookingsQuery = bookingsQuery.gte('createdAt', startDate)
    }

    if (endDate) {
      bookingsQuery = bookingsQuery.lte('createdAt', endDate)
    }

    const { data: bookings, error: bookingsError } = await bookingsQuery

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError)
      return NextResponse.json(
        { error: 'Failed to fetch bookings' },
        { status: 500 }
      )
    }

    // Fetch payments for these bookings
    const bookingIds = bookings?.map((b: any) => b.id) || []
    let payments: any[] = []
    
    if (bookingIds.length > 0) {
      let paymentsQuery = supabase
        .from('payments')
        .select('id, bookingId, amount, tutorPayout, platformFee, status, paidAt, createdAt')
        .in('bookingId', bookingIds)

      const { data: paymentsData, error: paymentsError } = await paymentsQuery

      if (paymentsError) {
        console.error('Error fetching payments:', paymentsError)
      } else {
        payments = paymentsData || []
      }
    }

    // Fetch withdrawal requests
    let withdrawalsQuery = supabase
      .from('withdrawal_requests')
      .select('id, tutorId, amount, status, requestedAt')

    if (tutorId) {
      withdrawalsQuery = withdrawalsQuery.eq('tutorId', tutorId)
    }

    if (startDate) {
      withdrawalsQuery = withdrawalsQuery.gte('requestedAt', startDate)
    }

    if (endDate) {
      withdrawalsQuery = withdrawalsQuery.lte('requestedAt', endDate)
    }

    const { data: withdrawals, error: withdrawalsError } = await withdrawalsQuery

    if (withdrawalsError) {
      console.error('Error fetching withdrawals:', withdrawalsError)
    }

    // Get tutor profiles
    const tutorIds = [...new Set([
      ...(bookings?.map((b: any) => b.tutorId) || []),
      ...(withdrawals?.map((w: any) => w.tutorId) || []),
    ])]

    let tutorsMap = new Map()
    if (tutorIds.length > 0) {
      const { data: tutorsData } = await supabase
        .from('tutor_profiles')
        .select('id, userId, currency')
        .in('id', tutorIds)

      if (tutorsData) {
        tutorsData.forEach((tutor: any) => {
          tutorsMap.set(tutor.id, tutor)
        })
      }

      // Get user names
      const userIds = tutorsData?.map((t: any) => t.userId).filter(Boolean) || []
      if (userIds.length > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('id, name, email')
          .in('id', userIds)

        if (usersData) {
          tutorsData?.forEach((tutor: any) => {
            const user = usersData.find((u: any) => u.id === tutor.userId)
            if (user) {
              tutorsMap.set(tutor.id, { ...tutor, userName: user.name, userEmail: user.email })
            }
          })
        }
      }
    }

    // Group data by time period
    const statistics: Record<string, {
      tutorId: string
      tutorName: string
      tutorEmail: string
      period: string
      totalOrders: number
      totalEarnings: number
      totalPayoutsOwed: number
      completedOrders: number
      pendingOrders: number
      paidPayments: number
      pendingWithdrawals: number
      currency: string
    }> = {}

    // Helper function to get period key
    const getPeriodKey = (date: Date): string => {
      if (period === 'daily') {
        return date.toISOString().split('T')[0] // YYYY-MM-DD
      } else if (period === 'weekly') {
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay()) // Start of week (Sunday)
        return weekStart.toISOString().split('T')[0]
      } else {
        // monthly
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      }
    }

    // Process bookings
    bookings?.forEach((booking: any) => {
      const tutor = tutorsMap.get(booking.tutorId)
      if (!tutor) return

      const bookingDate = new Date(booking.createdAt)
      const periodKey = getPeriodKey(bookingDate)
      const key = `${booking.tutorId}-${periodKey}`

      if (!statistics[key]) {
        statistics[key] = {
          tutorId: booking.tutorId,
          tutorName: tutor.userName || 'Unknown',
          tutorEmail: tutor.userEmail || '',
          period: periodKey,
          totalOrders: 0,
          totalEarnings: 0,
          totalPayoutsOwed: 0,
          completedOrders: 0,
          pendingOrders: 0,
          paidPayments: 0,
          pendingWithdrawals: 0,
          currency: parseCurrencyCode(tutor.currency || DEFAULT_CURRENCY),
        }
      }

      statistics[key].totalOrders++
      if (booking.status === 'COMPLETED') {
        statistics[key].completedOrders++
      } else if (booking.status === 'PENDING') {
        statistics[key].pendingOrders++
      }
    })

    // Process payments
    payments.forEach((payment: any) => {
      const booking = bookings?.find((b: any) => b.id === payment.bookingId)
      if (!booking) return

      const tutor = tutorsMap.get(booking.tutorId)
      if (!tutor) return

      const paymentDate = payment.paidAt ? new Date(payment.paidAt) : new Date(payment.createdAt)
      const periodKey = getPeriodKey(paymentDate)
      const key = `${booking.tutorId}-${periodKey}`

      if (!statistics[key]) {
        statistics[key] = {
          tutorId: booking.tutorId,
          tutorName: tutor.userName || 'Unknown',
          tutorEmail: tutor.userEmail || '',
          period: periodKey,
          totalOrders: 0,
          totalEarnings: 0,
          totalPayoutsOwed: 0,
          completedOrders: 0,
          pendingOrders: 0,
          paidPayments: 0,
          pendingWithdrawals: 0,
          currency: parseCurrencyCode(tutor.currency || DEFAULT_CURRENCY),
        }
      }

      if (payment.status === 'PAID') {
        statistics[key].totalEarnings += payment.tutorPayout || 0
        statistics[key].paidPayments++
      }

      // Calculate payouts owed (earnings minus completed withdrawals)
      statistics[key].totalPayoutsOwed = statistics[key].totalEarnings
    })

    // Process withdrawals
    withdrawals?.forEach((withdrawal: any) => {
      const tutor = tutorsMap.get(withdrawal.tutorId)
      if (!tutor) return

      const withdrawalDate = new Date(withdrawal.requestedAt)
      const periodKey = getPeriodKey(withdrawalDate)
      const key = `${withdrawal.tutorId}-${periodKey}`

      if (!statistics[key]) {
        statistics[key] = {
          tutorId: withdrawal.tutorId,
          tutorName: tutor.userName || 'Unknown',
          tutorEmail: tutor.userEmail || '',
          period: periodKey,
          totalOrders: 0,
          totalEarnings: 0,
          totalPayoutsOwed: 0,
          completedOrders: 0,
          pendingOrders: 0,
          paidPayments: 0,
          pendingWithdrawals: 0,
          currency: parseCurrencyCode(tutor.currency || DEFAULT_CURRENCY),
        }
      }

      if (['PENDING', 'APPROVED', 'PROCESSING'].includes(withdrawal.status)) {
        statistics[key].pendingWithdrawals += withdrawal.amount || 0
        statistics[key].totalPayoutsOwed -= withdrawal.amount || 0
      }
    })

    // Convert to array and sort
    const result = Object.values(statistics).sort((a, b) => {
      if (a.period !== b.period) {
        return b.period.localeCompare(a.period) // Most recent first
      }
      return a.tutorName.localeCompare(b.tutorName)
    })

    return NextResponse.json(
      {
        period,
        statistics: result,
        summary: {
          totalTutors: new Set(result.map((s) => s.tutorId)).size,
          totalOrders: result.reduce((sum, s) => sum + s.totalOrders, 0),
          totalEarnings: result.reduce((sum, s) => sum + s.totalEarnings, 0),
          totalPayoutsOwed: result.reduce((sum, s) => sum + s.totalPayoutsOwed, 0),
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Tutor statistics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

