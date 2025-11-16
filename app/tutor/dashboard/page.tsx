import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import DashboardSidebar from '@/components/DashboardSidebar'
import { supabase } from '@/lib/supabase-db'
import TutorClassManagement from '@/components/TutorClassManagement'
import TutorNotificationsPanel from '@/components/TutorNotificationsPanel'
import TutorAssignedStudents from '@/components/TutorAssignedStudents'
import AvailabilityCalendar from '@/components/AvailabilityCalendar'
import { formatCurrency, parseCurrencyCode, getCurrency } from '@/lib/currency'
import { Calendar, Clock, Users, DollarSign, TrendingUp, Video, BookOpen } from 'lucide-react'
import Link from 'next/link'
import EarningsSummary from '@/components/EarningsSummary'

export default async function TutorDashboardPage() {
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
    .order('scheduledAt', { ascending: true })

  const bookings = bookingsData || []

  // Import security utilities
  const { sanitizeUser } = await import('@/lib/security')

  // Fetch related student data
  for (const booking of bookings) {
    if (booking.studentId) {
      const { data: student } = await supabase
        .from('users')
        .select('*')
        .eq('id', booking.studentId)
        .single()
      
      // Sanitize student data - tutors can see name, email, and phone for booking coordination
      // but only for their own bookings (already filtered by tutorId)
      if (student) {
        booking.student = sanitizeUser(
          student,
          'booking_partner', // Tutor has booking with student
          true, // Include email for communication
          true  // Include phone for lesson coordination
        )
      } else {
        booking.student = null
      }
      
      // Fetch student address for in-person lessons (only for tutors with bookings)
      if (booking.lessonType === 'IN_PERSON' && booking.addressId) {
        const { data: address } = await supabase
          .from('addresses')
          .select('*')
          .eq('id', booking.addressId)
          .single()
        booking.studentAddress = address || null
      }
    }
    
    // Fetch video session if exists
    if (booking.id) {
      const { data: videoSession } = await supabase
        .from('video_sessions')
        .select('sessionToken, status')
        .eq('bookingId', booking.id)
        .single()
      booking.videoSession = videoSession || null
    }
  }

  // Fetch notifications
  const { data: notificationsData } = await supabase
    .from('notifications')
    .select('*')
    .eq('userId', session.user.id)
    .order('createdAt', { ascending: false })
    .limit(20)

  const notifications = notificationsData || []

  // Fetch payments for earnings calculation
  const bookingIds = bookings.map((b: any) => b.id)
  let payments: any[] = []
  let pendingPayments: any[] = []
  if (bookingIds.length > 0) {
    // Fetch all payments (both PAID and PENDING)
    const { data: allPaymentsData } = await supabase
      .from('payments')
      .select('*')
      .in('bookingId', bookingIds)
    
    const allPayments = allPaymentsData || []
    payments = allPayments.filter((p: any) => p.status === 'PAID')
    pendingPayments = allPayments.filter((p: any) => p.status === 'PENDING')
  }

  // Calculate statistics
  const upcomingBookings = bookings.filter((b: any) => {
    const scheduled = new Date(b.scheduledAt)
    return scheduled >= new Date() && (b.status === 'CONFIRMED' || b.status === 'PENDING')
  })

  const completedBookings = bookings.filter((b: any) => b.status === 'COMPLETED')
  const pendingBookings = bookings.filter((b: any) => b.status === 'PENDING')
  const confirmedBookings = bookings.filter((b: any) => b.status === 'CONFIRMED')

  const totalHours = Math.floor(
    completedBookings.reduce((sum: number, b: any) => sum + b.duration, 0) / 60
  )

  const totalEarnings = payments.reduce((sum: number, p: any) => sum + (p.tutorPayout || 0), 0)

  // Calculate this month earnings
  const thisMonth = new Date()
  thisMonth.setDate(1)
  const thisMonthEarnings = payments
    .filter((p: any) => {
      const paidAt = p.paidAt ? new Date(p.paidAt) : new Date(p.createdAt)
      return paidAt >= thisMonth
    })
    .reduce((sum: number, p: any) => sum + (p.tutorPayout || 0), 0)

  // Calculate last month earnings for comparison
  const lastMonth = new Date()
  lastMonth.setMonth(lastMonth.getMonth() - 1)
  lastMonth.setDate(1)
  const lastMonthEnd = new Date()
  lastMonthEnd.setDate(0) // Last day of previous month
  const lastMonthEarnings = payments
    .filter((p: any) => {
      const paidAt = p.paidAt ? new Date(p.paidAt) : new Date(p.createdAt)
      return paidAt >= lastMonth && paidAt <= lastMonthEnd
    })
    .reduce((sum: number, p: any) => sum + (p.tutorPayout || 0), 0)

  // Calculate pending payout
  const pendingPayout = pendingPayments.reduce((sum: number, p: any) => sum + (p.tutorPayout || 0), 0)

  // Get currency from tutor profile
  const currency = parseCurrencyCode(tutorProfile.currency || 'GHS')
  
  // Get currency symbol for display
  const currencySymbol = getCurrency(currency).symbol

  // Get unique students count
  const uniqueStudents = new Set(bookings.map((b: any) => b.studentId).filter(Boolean)).size

  // Get upcoming classes (next 7 days)
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  const upcomingClasses = upcomingBookings
    .filter((b: any) => {
      const scheduled = new Date(b.scheduledAt)
      return scheduled <= nextWeek
    })
    .slice(0, 5)

  // Get today's classes
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const todaysClasses = bookings.filter((b: any) => {
    const scheduled = new Date(b.scheduledAt)
    return scheduled >= today && scheduled < tomorrow && (b.status === 'CONFIRMED' || b.status === 'PENDING')
  })

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col lg:ml-0">
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Tutor Dashboard</h1>
              <p className="text-gray-600">Manage your classes, students, and earnings</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Upcoming Classes</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{upcomingBookings.length}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {todaysClasses.length} today
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Students</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{uniqueStudents}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Active students
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Hours</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{totalHours}h</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Clock className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {completedBookings.length} completed
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">This Month</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatCurrency(thisMonthEarnings, parseCurrencyCode(tutorProfile.currency))}
                    </p>
                  </div>
                  <div className="p-3 bg-pink-100 rounded-lg">
                    <DollarSign className="h-6 w-6 text-pink-600" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {formatCurrency(totalEarnings, parseCurrencyCode(tutorProfile.currency))} total
                </p>
              </div>
            </div>

            {/* Earnings Summary */}
            <div className="mb-8">
              <EarningsSummary
                totalEarnings={totalEarnings}
                thisMonth={thisMonthEarnings}
                lastMonth={lastMonthEarnings}
                pendingPayout={pendingPayout}
                currency={currencySymbol}
              />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Class Management */}
              <div className="lg:col-span-2 space-y-6">
                <TutorClassManagement 
                  bookings={bookings}
                  tutorProfile={tutorProfile}
                />

                <TutorAssignedStudents bookings={bookings} />

                {/* Today's Classes */}
                {todaysClasses.length > 0 && (
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-pink-600" />
                        Today&apos;s Classes
                      </h2>
                      <Link
                        href="/schedule"
                        className="text-sm text-pink-600 hover:text-pink-700 font-medium"
                      >
                        View All →
                      </Link>
                    </div>
                    <div className="space-y-3">
                      {todaysClasses.map((booking: any) => (
                        <div
                          key={booking.id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-gray-800">
                                  {booking.student?.name || 'Student'}
                                </h3>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  booking.status === 'CONFIRMED'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {booking.status}
                                </span>
                              </div>
                              <p className="text-gray-600 mb-2">{booking.subject}</p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {new Date(booking.scheduledAt).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                  {' - '}
                                  {booking.duration} min
                                </div>
                                {booking.lessonType === 'ONLINE' && (
                                  <div className="flex items-center gap-1">
                                    <Video className="h-4 w-4" />
                                    Online
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg text-gray-900">
                                {formatCurrency(booking.price, parseCurrencyCode(booking.currency))}
                              </p>
                              {booking.lessonType === 'ONLINE' && booking.status === 'CONFIRMED' && (
                                <Link
                                  href={`/lessons/${booking.id}`}
                                  className="mt-2 inline-block px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors text-sm font-medium"
                                >
                                  Start Class
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Notifications & Quick Actions */}
              <div className="space-y-6">
                {/* Service Fees Info */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Service Fees</h3>
                  <div className="text-sm text-gray-600 mb-3">
                    <p className="mb-2">
                      <strong className="text-gray-800">Service Fee:</strong> 20% of booking price
                    </p>
                    <p>
                      <strong className="text-gray-800">Your Payout:</strong> 80% of booking price
                    </p>
                  </div>
                  <Link
                    href="/tutor/service-fees"
                    className="text-sm text-pink-600 hover:text-pink-700 font-medium"
                  >
                    View detailed breakdown →
                  </Link>
                </div>

                <TutorNotificationsPanel notifications={notifications} />

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Link
                      href="/tutor/profile"
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <BookOpen className="h-5 w-5 text-pink-600" />
                      <span className="font-medium text-gray-700">Update Profile</span>
                    </Link>
                    <Link
                      href="/schedule"
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-gray-700">View Schedule</span>
                    </Link>
                    <Link
                      href="/tutor/availability"
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Clock className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-gray-700">Set Availability</span>
                    </Link>
                    <Link
                      href="/tutor/service-fees"
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <DollarSign className="h-5 w-5 text-yellow-600" />
                      <span className="font-medium text-gray-700">Service Fees Info</span>
                    </Link>
                    <Link
                      href="/lessons"
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Video className="h-5 w-5 text-purple-600" />
                      <span className="font-medium text-gray-700">All Lessons</span>
                    </Link>
                  </div>
                </div>

                {/* Performance Summary */}
                <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl shadow-md p-6 text-white">
                  <h3 className="text-lg font-semibold mb-4">Performance</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-pink-100">Completion Rate</span>
                      <span className="font-bold">
                        {bookings.length > 0
                          ? Math.round((completedBookings.length / bookings.length) * 100)
                          : 0}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-pink-100">Avg Rating</span>
                      <span className="font-bold">
                        {tutorProfile.rating > 0 ? tutorProfile.rating.toFixed(1) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-pink-100">Total Reviews</span>
                      <span className="font-bold">{tutorProfile.totalReviews || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

