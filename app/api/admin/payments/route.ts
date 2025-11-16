import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-db'
import { parseCurrencyCode, DEFAULT_CURRENCY } from '@/lib/currency'

// Get all tutor payment records for completed classes
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
    const tutorId = searchParams.get('tutorId') // Optional: filter by tutor
    const status = searchParams.get('status') // Optional: filter by payment status
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Fetch all completed bookings
    let bookingsQuery = supabase
      .from('bookings')
      .select('id, tutorId, studentId, subject, scheduledAt, duration, price, currency, status, createdAt')
      .eq('status', 'COMPLETED')

    if (tutorId) {
      bookingsQuery = bookingsQuery.eq('tutorId', tutorId)
    }

    if (startDate) {
      bookingsQuery = bookingsQuery.gte('scheduledAt', startDate)
    }

    if (endDate) {
      bookingsQuery = bookingsQuery.lte('scheduledAt', endDate)
    }

    const { data: bookings, error: bookingsError } = await bookingsQuery.order('scheduledAt', { ascending: false })

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
        .select('*')
        .in('bookingId', bookingIds)

      if (status) {
        paymentsQuery = paymentsQuery.eq('status', status.toUpperCase())
      }

      const { data: paymentsData, error: paymentsError } = await paymentsQuery

      if (paymentsError) {
        console.error('Error fetching payments:', paymentsError)
      } else {
        payments = paymentsData || []
      }
    }

    // Get all unique tutor IDs
    const tutorIds = [...new Set(bookings?.map((b: any) => b.tutorId).filter(Boolean) || [])]

    // Fetch tutor profiles and user data
    const tutorsMap = new Map()
    if (tutorIds.length > 0) {
      const { data: tutorsData } = await supabase
        .from('tutor_profiles')
        .select('id, userId, currency')
        .in('id', tutorIds)

      if (tutorsData) {
        const userIds = tutorsData.map((t: any) => t.userId).filter(Boolean)
        const { data: usersData } = await supabase
          .from('users')
          .select('id, name, email')
          .in('id', userIds)

        tutorsData.forEach((tutor: any) => {
          const user = usersData?.find((u: any) => u.id === tutor.userId)
          tutorsMap.set(tutor.id, {
            ...tutor,
            userName: user?.name || 'Unknown',
            userEmail: user?.email || '',
          })
        })
      }
    }

    // Get student data
    const studentIds = [...new Set(bookings?.map((b: any) => b.studentId).filter(Boolean) || [])]
    const studentsMap = new Map()
    if (studentIds.length > 0) {
      const { data: studentsData } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', studentIds)

      if (studentsData) {
        studentsData.forEach((student: any) => {
          studentsMap.set(student.id, student)
        })
      }
    }

    // Combine bookings with payments and related data
    const paymentRecords = bookings?.map((booking: any) => {
      const payment = payments.find((p: any) => p.bookingId === booking.id)
      const tutor = tutorsMap.get(booking.tutorId)
      const student = booking.studentId ? studentsMap.get(booking.studentId) : null

      return {
        bookingId: booking.id,
        tutorId: booking.tutorId,
        tutorName: tutor?.userName || 'Unknown',
        tutorEmail: tutor?.userEmail || '',
        studentId: booking.studentId,
        studentName: student?.name || 'Unknown',
        studentEmail: student?.email || '',
        subject: booking.subject,
        scheduledAt: booking.scheduledAt,
        duration: booking.duration,
        bookingPrice: booking.price || 0,
        currency: parseCurrencyCode(booking.currency || tutor?.currency || DEFAULT_CURRENCY),
        paymentId: payment?.id || null,
        paymentAmount: payment?.amount || 0,
        platformFee: payment?.platformFee || 0,
        tutorPayout: payment?.tutorPayout || 0,
        paymentStatus: payment?.status || 'PENDING',
        paidAt: payment?.paidAt || null,
        createdAt: payment?.createdAt || booking.createdAt,
      }
    }) || []

    // Calculate summary statistics
    const summary = {
      totalCompletedClasses: paymentRecords.length,
      totalBookingsWithPayments: paymentRecords.filter((r: any) => r.paymentId).length,
      totalRevenue: paymentRecords.reduce((sum: number, r: any) => sum + r.paymentAmount, 0),
      totalPlatformFees: paymentRecords.reduce((sum: number, r: any) => sum + r.platformFee, 0),
      totalTutorPayouts: paymentRecords.reduce((sum: number, r: any) => sum + r.tutorPayout, 0),
      paidPayments: paymentRecords.filter((r: any) => r.paymentStatus === 'PAID').length,
      pendingPayments: paymentRecords.filter((r: any) => r.paymentStatus === 'PENDING').length,
    }

    return NextResponse.json(
      {
        paymentRecords,
        summary,
        totalRecords: paymentRecords.length,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Tutor payments error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

