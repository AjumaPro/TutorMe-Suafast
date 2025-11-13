import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase-db'
import { formatCurrency, parseCurrencyCode } from '@/lib/currency'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  CreditCard,
  Search,
  Filter,
  TrendingUp,
  BookOpen,
  Sparkles,
  ArrowRight,
  CalendarDays,
  User,
  Phone,
} from 'lucide-react'

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  const statusFilter = searchParams.status as string | undefined
  const searchQuery = (searchParams.search as string | undefined)?.toLowerCase() || ''

  // Fetch bookings based on user role
  let bookings: any[] = []
  let tutorProfile = null

  if (session.user.role === 'PARENT') {
    const { data: bookingsData } = await supabase
      .from('bookings')
      .select('*')
      .eq('studentId', session.user.id)
      .order('scheduledAt', { ascending: false })
    
    bookings = bookingsData || []
    
    // Fetch related data
    for (const booking of bookings) {
      if (booking.tutorId) {
        const { data: tutor } = await supabase
          .from('tutor_profiles')
          .select('*')
          .eq('id', booking.tutorId)
          .single()
        
        if (tutor) {
          booking.tutor = tutor
          if (tutor.userId) {
            const { data: tutorUser } = await supabase
              .from('users')
              .select('name, email, image')
              .eq('id', tutor.userId)
              .single()
            booking.tutor.user = tutorUser || null
          }
        }
      }
      
      // Fetch payment and review
      const { data: payment } = await supabase
        .from('payments')
        .select('*')
        .eq('bookingId', booking.id)
        .single()
      
      const { data: review } = await supabase
        .from('reviews')
        .select('*')
        .eq('bookingId', booking.id)
        .single()
      
      booking.payment = payment || null
      booking.review = review || null
    }
  } else if (session.user.role === 'TUTOR') {
    const { data: tutorProfileData } = await supabase
      .from('tutor_profiles')
      .select('*')
      .eq('userId', session.user.id)
      .single()
    
    tutorProfile = tutorProfileData || null

    if (tutorProfile?.id) {
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('*')
        .eq('tutorId', tutorProfile.id)
        .order('scheduledAt', { ascending: false })
      
      bookings = bookingsData || []
      
      // Fetch related data
      for (const booking of bookings) {
        if (booking.studentId) {
          const { data: student } = await supabase
            .from('users')
            .select('name, email, image, phone')
            .eq('id', booking.studentId)
            .single()
          booking.student = student || null
          
          // Fetch student address if it's an in-person lesson
          if (booking.lessonType === 'IN_PERSON' && booking.addressId) {
            const { data: address } = await supabase
              .from('addresses')
              .select('*')
              .eq('id', booking.addressId)
              .single()
            booking.studentAddress = address || null
          }
        }
        
        // Fetch payment and review
        const { data: payment } = await supabase
          .from('payments')
          .select('*')
          .eq('bookingId', booking.id)
          .single()
        
        const { data: review } = await supabase
          .from('reviews')
          .select('*')
          .eq('bookingId', booking.id)
          .single()
        
        booking.payment = payment || null
        booking.review = review || null
      }
    }
  }

  // Filter bookings
  let filteredBookings = bookings

  if (statusFilter && statusFilter !== 'all') {
    filteredBookings = filteredBookings.filter((b) => b.status === statusFilter.toUpperCase())
  }

  if (searchQuery) {
    filteredBookings = filteredBookings.filter((booking) => {
      const otherPerson =
        session.user.role === 'PARENT'
          ? booking.tutor?.user
          : booking.student
      const name = otherPerson?.name?.toLowerCase() || ''
      const subject = booking.subject?.toLowerCase() || ''
      return name.includes(searchQuery) || subject.includes(searchQuery)
    })
  }

  // Calculate statistics
  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === 'PENDING').length,
    confirmed: bookings.filter((b) => b.status === 'CONFIRMED').length,
    completed: bookings.filter((b) => b.status === 'COMPLETED').length,
    cancelled: bookings.filter((b) => b.status === 'CANCELLED').length,
    upcoming: bookings.filter((b) => {
      const date = new Date(b.scheduledAt)
      return date > new Date() && b.status !== 'CANCELLED' && b.status !== 'COMPLETED'
    }).length,
    totalRevenue: bookings
      .filter((b) => b.payment?.status === 'PAID')
      .reduce((sum, b) => sum + (b.price || 0), 0),
  }

  // Separate upcoming and past bookings
  const now = new Date()
  const upcomingBookings = filteredBookings.filter(
    (b) => new Date(b.scheduledAt) > now && b.status !== 'CANCELLED' && b.status !== 'COMPLETED'
  )
  const pastBookings = filteredBookings.filter(
    (b) => new Date(b.scheduledAt) <= now || b.status === 'COMPLETED' || b.status === 'CANCELLED'
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <CheckCircle className="h-4 w-4" />
      case 'CANCELLED':
        return <XCircle className="h-4 w-4" />
      case 'PENDING':
        return <AlertCircle className="h-4 w-4" />
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  const formatRelativeTime = (date: Date) => {
    const now = new Date()
    const bookingDate = new Date(date)
    const diffInMs = bookingDate.getTime() - now.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInDays < 0) {
      const daysAgo = Math.abs(diffInDays)
      if (daysAgo === 0) return 'Today'
      if (daysAgo === 1) return 'Yesterday'
      return `${daysAgo} days ago`
    } else if (diffInDays === 0) {
      return 'Today'
    } else if (diffInDays === 1) {
      return 'Tomorrow'
    } else if (diffInDays <= 7) {
      return `In ${diffInDays} days`
    }
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <BookOpen className="h-10 w-10 text-pink-600" />
                My Bookings
              </h1>
              <p className="text-gray-600 text-lg">View and manage all your bookings</p>
          </div>
          {session.user.role === 'PARENT' && (
            <Link
              href="/search"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl hover:from-pink-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl font-medium transform hover:-translate-y-0.5"
            >
                <Sparkles className="h-5 w-5" />
              Book a Tutor
            </Link>
          )}
        </div>

          {/* Statistics Cards */}
          {bookings.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-blue-500" />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-yellow-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-yellow-500" />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Confirmed</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.confirmed}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-blue-500" />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Upcoming</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.upcoming}</p>
                  </div>
                  <CalendarDays className="h-8 w-8 text-purple-500" />
                </div>
              </div>
              {session.user.role === 'TUTOR' && (
                <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-pink-500 col-span-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(stats.totalRevenue, 'GHS')}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-pink-500" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Search and Filter Bar */}
          {bookings.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <form action="/bookings" method="get" className="w-full">
                    <input
                      type="text"
                      name="search"
                      placeholder="Search by name or subject..."
                      defaultValue={searchQuery}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    />
                    {statusFilter && (
                      <input type="hidden" name="status" value={statusFilter} />
                    )}
                  </form>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Filter className="h-5 w-5 text-gray-500" />
                  <Link
                    href={`/bookings${searchQuery ? `?search=${searchQuery}` : ''}`}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      !statusFilter || statusFilter === 'all'
                        ? 'bg-pink-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All ({stats.total})
                  </Link>
                  <Link
                    href={`/bookings?status=pending${searchQuery ? `&search=${searchQuery}` : ''}`}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      statusFilter === 'pending'
                        ? 'bg-yellow-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Pending ({stats.pending})
                  </Link>
                  <Link
                    href={`/bookings?status=confirmed${searchQuery ? `&search=${searchQuery}` : ''}`}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      statusFilter === 'confirmed'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Confirmed ({stats.confirmed})
                  </Link>
                  <Link
                    href={`/bookings?status=completed${searchQuery ? `&search=${searchQuery}` : ''}`}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      statusFilter === 'completed'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Completed ({stats.completed})
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Empty State */}
        {bookings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 md:p-16 text-center border-2 border-dashed border-gray-200">
            <div className="max-w-md mx-auto">
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full blur-2xl opacity-50"></div>
                </div>
                <div className="relative">
                  <CreditCard className="h-24 w-24 text-gray-300 mx-auto" />
                  <div className="absolute -top-2 -right-2">
                    <Sparkles className="h-8 w-8 text-pink-500 animate-pulse" />
                  </div>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No bookings yet</h3>
              <p className="text-gray-600 mb-8 text-lg">
                {session.user.role === 'PARENT'
                  ? "Start your learning journey by booking your first tutor session!"
                  : "You haven't received any booking requests yet. Your bookings will appear here."}
              </p>
              {session.user.role === 'PARENT' && (
                <Link
                  href="/search"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl hover:from-pink-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl font-medium text-lg transform hover:-translate-y-0.5"
                >
                  <Sparkles className="h-5 w-5" />
                  Find a Tutor
                  <ArrowRight className="h-5 w-5" />
                </Link>
              )}
            </div>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No bookings found</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search or filter criteria.
            </p>
              <Link
              href="/bookings"
                className="inline-block px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium"
              >
              Clear Filters
              </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Upcoming Bookings */}
            {upcomingBookings.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <CalendarDays className="h-6 w-6 text-purple-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Upcoming Sessions</h2>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                    {upcomingBookings.length}
                  </span>
                </div>
          <div className="space-y-4">
                  {upcomingBookings.map((booking) => {
              const otherPerson =
                session.user.role === 'PARENT'
                        ? booking.tutor?.user
                  : booking.student
                    const relativeTime = formatRelativeTime(booking.scheduledAt)

              return (
                <div
                  key={booking.id}
                        className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-6 border-l-4 border-purple-500"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                {otherPerson?.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h3 className="text-lg font-semibold text-gray-800">
                                    {otherPerson?.name || 'Unknown'}
                            </h3>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(
                                booking.status
                              )}`}
                            >
                              {getStatusIcon(booking.status)}
                              {booking.status}
                            </span>
                                  {relativeTime && (
                                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                                      {relativeTime}
                                    </span>
                                  )}
                          </div>
                                <p className="text-gray-700 font-medium mb-3 text-lg">
                                  {booking.subject}
                                </p>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                  <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {new Date(booking.scheduledAt).toLocaleDateString('en-US', {
                                      weekday: 'long',
                                year: 'numeric',
                                      month: 'long',
                                day: 'numeric',
                              })}
                            </div>
                                  <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              {new Date(booking.scheduledAt).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                                    {' • '}
                              {booking.duration} min
                            </div>
                                  <div className="flex items-center gap-2">
                              {booking.lessonType === 'ONLINE' ? (
                                <Video className="h-4 w-4" />
                              ) : (
                                <MapPin className="h-4 w-4" />
                              )}
                              {booking.lessonType === 'ONLINE' ? 'Online' : 'In-Person'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                                {formatCurrency(booking.price, parseCurrencyCode(booking.currency))}
                        </p>
                        {booking.payment ? (
                          <p
                                  className={`text-xs mt-1 font-medium ${
                              booking.payment.status === 'PAID'
                                ? 'text-green-600'
                                : booking.payment.status === 'PENDING'
                                ? 'text-yellow-600'
                                : 'text-red-600'
                            }`}
                          >
                            Payment: {booking.payment.status}
                          </p>
                        ) : (
                          <p className="text-xs mt-1 text-gray-500">Payment pending</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {!booking.payment && booking.status === 'PENDING' && (
                          <Link
                            href={`/bookings/${booking.id}/payment`}
                            className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium flex items-center gap-2"
                          >
                            <DollarSign className="h-4 w-4" />
                            Pay Now
                          </Link>
                        )}
                        <Link
                          href={`/lessons/${booking.id}`}
                                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors font-medium flex items-center gap-2"
                        >
                          View Details
                                <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
                </div>
              </div>
            )}

            {/* Past Bookings */}
            {pastBookings.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="h-6 w-6 text-gray-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Past Sessions</h2>
                  <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                    {pastBookings.length}
                  </span>
                </div>
                <div className="space-y-4">
                  {pastBookings.map((booking) => {
                    const otherPerson =
                      session.user.role === 'PARENT'
                        ? booking.tutor?.user
                        : booking.student

                    return (
                      <div
                        key={booking.id}
                        className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-6 opacity-75"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white font-bold text-lg">
                                {otherPerson?.name?.charAt(0).toUpperCase() || '?'}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                  <h3 className="text-lg font-semibold text-gray-800">
                                    {otherPerson?.name || 'Unknown'}
                                  </h3>
                                  <span
                                    className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(
                                      booking.status
                                    )}`}
                                  >
                                    {getStatusIcon(booking.status)}
                                    {booking.status}
                                  </span>
                                </div>
                                <p className="text-gray-700 font-medium mb-3">{booking.subject}</p>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {new Date(booking.scheduledAt).toLocaleDateString('en-US', {
                                      weekday: 'short',
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    {new Date(booking.scheduledAt).toLocaleTimeString('en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                    {' • '}
                                    {booking.duration} min
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {booking.lessonType === 'ONLINE' ? (
                                      <Video className="h-4 w-4" />
                                    ) : (
                                      <MapPin className="h-4 w-4" />
                                    )}
                                    {booking.lessonType === 'ONLINE' ? 'Online' : 'In-Person'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-3">
                            <div className="text-right">
                              <p className="text-2xl font-bold text-gray-900">
                                {formatCurrency(booking.price, parseCurrencyCode(booking.currency))}
                              </p>
                              {booking.payment ? (
                                <p
                                  className={`text-xs mt-1 font-medium ${
                                    booking.payment.status === 'PAID'
                                      ? 'text-green-600'
                                      : booking.payment.status === 'PENDING'
                                      ? 'text-yellow-600'
                                      : 'text-red-600'
                                  }`}
                                >
                                  Payment: {booking.payment.status}
                                </p>
                              ) : (
                                <p className="text-xs mt-1 text-gray-500">Payment pending</p>
                              )}
                            </div>
                            <Link
                              href={`/lessons/${booking.id}`}
                              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                            >
                              View Details
                            </Link>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
