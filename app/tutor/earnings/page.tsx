import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase-db'
import { formatCurrency, parseCurrencyCode, getCurrency } from '@/lib/currency'
import { Wallet, TrendingUp, TrendingDown, Calendar, DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import WithdrawalRequestForm from '@/components/WithdrawalRequestForm'

export default async function TutorEarningsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'TUTOR') {
    redirect('/auth/signin')
  }

  // Fetch tutor profile
  const { data: tutorProfile } = await supabase
    .from('tutor_profiles')
    .select('*')
    .eq('userId', session.user.id)
    .single()

  if (!tutorProfile) {
    redirect('/tutor/profile')
  }

  // Fetch all bookings for this tutor
  const { data: bookingsData } = await supabase
    .from('bookings')
    .select('*')
    .eq('tutorId', tutorProfile.id)
    .order('scheduledAt', { ascending: false })

  const bookings = bookingsData || []

  // Fetch all payments for these bookings
  const bookingIds = bookings.map((b: any) => b.id)
  let allPayments: any[] = []
  if (bookingIds.length > 0) {
    const { data: paymentsData } = await supabase
      .from('payments')
      .select('*')
      .in('bookingId', bookingIds)
      .order('createdAt', { ascending: false })
    
    allPayments = paymentsData || []
  }

  // Fetch student data for bookings
  const studentIds = [...new Set(bookings.map((b: any) => b.studentId).filter(Boolean))]
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

  // Attach payments and student data to bookings
  const bookingsWithPayments = bookings.map((booking: any) => {
    const payment = allPayments.find((p: any) => p.bookingId === booking.id)
    const student = booking.studentId ? studentsMap.get(booking.studentId) : null
    return { ...booking, payment, student }
  })

  // Calculate earnings statistics
  const paidPayments = allPayments.filter((p: any) => p.status === 'PAID')
  const pendingPayments = allPayments.filter((p: any) => p.status === 'PENDING')

  const totalEarnings = paidPayments.reduce((sum: number, p: any) => sum + (p.tutorPayout || 0), 0)

  // This month earnings
  const thisMonth = new Date()
  thisMonth.setDate(1)
  const thisMonthEarnings = paidPayments
    .filter((p: any) => {
      const paidAt = p.paidAt ? new Date(p.paidAt) : new Date(p.createdAt)
      return paidAt >= thisMonth
    })
    .reduce((sum: number, p: any) => sum + (p.tutorPayout || 0), 0)

  // Last month earnings
  const lastMonth = new Date()
  lastMonth.setMonth(lastMonth.getMonth() - 1)
  lastMonth.setDate(1)
  const lastMonthEnd = new Date()
  lastMonthEnd.setDate(0)
  const lastMonthEarnings = paidPayments
    .filter((p: any) => {
      const paidAt = p.paidAt ? new Date(p.paidAt) : new Date(p.createdAt)
      return paidAt >= lastMonth && paidAt <= lastMonthEnd
    })
    .reduce((sum: number, p: any) => sum + (p.tutorPayout || 0), 0)

  // Pending payout
  const pendingPayout = pendingPayments.reduce((sum: number, p: any) => sum + (p.tutorPayout || 0), 0)

  // Monthly change percentage
  const monthlyChange = lastMonthEarnings > 0 
    ? ((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100 
    : 0

  // Get currency
  const currency = parseCurrencyCode(tutorProfile.currency || 'GHS')
  const currencySymbol = getCurrency(currency).symbol

  // Calculate available balance for withdrawal (total earnings minus pending withdrawals)
  // Fetch all withdrawal requests
  const { data: allWithdrawals } = await supabase
    .from('withdrawal_requests')
    .select('*')
    .eq('tutorId', tutorProfile.id)
    .order('requestedAt', { ascending: false })

  const withdrawals = allWithdrawals || []
  const pendingWithdrawals = withdrawals.filter((w: any) => 
    ['PENDING', 'APPROVED', 'PROCESSING'].includes(w.status)
  )

  const totalPendingWithdrawals = pendingWithdrawals.reduce(
    (sum: number, w: any) => sum + (w.amount || 0),
    0
  )

  const availableBalance = totalEarnings - totalPendingWithdrawals

  // Group earnings by month
  const earningsByMonth: Record<string, { earnings: number; count: number }> = {}
  paidPayments.forEach((payment: any) => {
    const paidAt = payment.paidAt ? new Date(payment.paidAt) : new Date(payment.createdAt)
    const monthKey = `${paidAt.getFullYear()}-${String(paidAt.getMonth() + 1).padStart(2, '0')}`
    if (!earningsByMonth[monthKey]) {
      earningsByMonth[monthKey] = { earnings: 0, count: 0 }
    }
    earningsByMonth[monthKey].earnings += payment.tutorPayout || 0
    earningsByMonth[monthKey].count += 1
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Wallet className="h-8 w-8 text-green-600" />
                Earnings & Payments
              </h1>
              <p className="text-gray-600">View your earnings history and payment details</p>
            </div>
            <Link
              href="/tutor/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Earnings</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(totalEarnings, currency)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Wallet className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">All time earnings</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">This Month</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(thisMonthEarnings, currency)}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  {monthlyChange >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-xs font-medium ${monthlyChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(monthlyChange).toFixed(1)}% vs last month
                  </span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Pending Payout</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {formatCurrency(pendingPayout, currency)}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">{pendingPayments.length} pending payment(s)</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Payments</p>
                <p className="text-3xl font-bold text-gray-900">{paidPayments.length}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Completed payments</p>
          </div>
        </div>

        {/* Withdrawal Request */}
        {availableBalance >= 100 && (
          <div className="mb-8">
            <WithdrawalRequestForm
              availableBalance={availableBalance}
              currency={currencySymbol}
            />
          </div>
        )}

        {/* Earnings by Month */}
        {Object.keys(earningsByMonth).length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Earnings by Month</h2>
            <div className="space-y-3">
              {Object.entries(earningsByMonth)
                .sort(([a], [b]) => b.localeCompare(a))
                .slice(0, 6)
                .map(([monthKey, data]) => {
                  const [year, month] = monthKey.split('-')
                  const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long', year: 'numeric' })
                  return (
                    <div key={monthKey} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-800">{monthName}</p>
                        <p className="text-sm text-gray-500">{data.count} payment(s)</p>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(data.earnings, currency)}
                      </p>
                    </div>
                  )
                })}
            </div>
          </div>
        )}

        {/* Withdrawal History */}
        {withdrawals.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Withdrawal History</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Frequency</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.slice(0, 10).map((withdrawal: any) => {
                    const requestedAt = new Date(withdrawal.requestedAt)
                    return (
                      <tr key={withdrawal.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="text-sm text-gray-900">
                            {requestedAt.toLocaleDateString('en-GH', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(withdrawal.amount, currency)}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-gray-600 capitalize">
                            {withdrawal.frequency.toLowerCase()}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {withdrawal.status === 'COMPLETED' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3" />
                              Completed
                            </span>
                          ) : withdrawal.status === 'PENDING' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <Clock className="h-3 w-3" />
                              Pending
                            </span>
                          ) : withdrawal.status === 'APPROVED' || withdrawal.status === 'PROCESSING' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <Clock className="h-3 w-3" />
                              {withdrawal.status}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <XCircle className="h-3 w-3" />
                              {withdrawal.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payment History */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Payment History</h2>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg font-medium">
                All ({allPayments.length})
              </button>
              <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg font-medium">
                Paid ({paidPayments.length})
              </button>
              <button className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded-lg font-medium">
                Pending ({pendingPayments.length})
              </button>
            </div>
          </div>

          {allPayments.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No payments yet</p>
              <p className="text-sm text-gray-500 mt-2">Your earnings will appear here once students make payments</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Booking</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Student</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Booking Price</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Service Fee (20%)</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Your Payout</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allPayments.map((payment: any) => {
                    const booking = bookingsWithPayments.find((b: any) => b.id === payment.bookingId)
                    const paidAt = payment.paidAt ? new Date(payment.paidAt) : new Date(payment.createdAt)
                    const bookingPrice = payment.amount || booking?.price || 0
                    const serviceFee = payment.platformFee || bookingPrice * 0.20
                    const tutorPayout = payment.tutorPayout || bookingPrice - serviceFee

                    return (
                      <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="text-sm text-gray-900">
                            {paidAt.toLocaleDateString('en-GH', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                          <div className="text-xs text-gray-500">
                            {paidAt.toLocaleTimeString('en-GH', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm font-medium text-gray-900">
                            {booking?.subject || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {booking?.duration || 0} min
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-gray-900">
                            {booking?.student?.name || 'N/A'}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(bookingPrice, currency)}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-red-600">
                            -{formatCurrency(serviceFee, currency)}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm font-bold text-green-600">
                            {formatCurrency(tutorPayout, currency)}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {payment.status === 'PAID' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3" />
                              Paid
                            </span>
                          ) : payment.status === 'PENDING' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <Clock className="h-3 w-3" />
                              Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <XCircle className="h-3 w-3" />
                              {payment.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

