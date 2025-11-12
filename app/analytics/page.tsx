import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import { prisma } from '@/lib/prisma'
import { TrendingUp, TrendingDown, Users, BookOpen, DollarSign, Clock, Star, Target, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import RecentActivity from '@/components/RecentActivity'
import Link from 'next/link'

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  // Fetch analytics data based on user role
  let stats = {
    totalBookings: 0,
    completedBookings: 0,
    totalRevenue: 0,
    totalHours: 0,
    averageRating: 0,
    totalStudents: 0,
    pendingBookings: 0,
    cancelledBookings: 0,
  }

  let previousPeriodStats = {
    totalBookings: 0,
    completedBookings: 0,
    totalRevenue: 0,
    totalHours: 0,
  }

  let tutorProfile = null

  // Calculate date ranges
  const now = new Date()
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

  if (session.user.role === 'TUTOR') {
    tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (tutorProfile) {
      const allBookings = await prisma.booking.findMany({
        where: { tutorId: tutorProfile.id },
        include: { payment: true },
      })

      const currentPeriodBookings = allBookings.filter(
        (b) => new Date(b.createdAt) >= currentMonthStart
      )
      const previousPeriodBookings = allBookings.filter(
        (b) =>
          new Date(b.createdAt) >= previousMonthStart &&
          new Date(b.createdAt) <= previousMonthEnd
      )

      stats.totalBookings = allBookings.length
      stats.completedBookings = allBookings.filter((b) => b.status === 'COMPLETED').length
      stats.pendingBookings = allBookings.filter((b) => b.status === 'PENDING').length
      stats.cancelledBookings = allBookings.filter((b) => b.status === 'CANCELLED').length
      stats.totalRevenue = allBookings
        .filter((b) => b.payment?.status === 'PAID')
        .reduce((sum, b) => sum + (b.payment?.tutorPayout || 0), 0)
      stats.totalHours = Math.floor(
        allBookings
          .filter((b) => b.status === 'COMPLETED')
          .reduce((sum, b) => sum + b.duration, 0) / 60
      )
      stats.averageRating = tutorProfile.rating

      // Previous period stats
      previousPeriodStats.totalBookings = previousPeriodBookings.length
      previousPeriodStats.completedBookings = previousPeriodBookings.filter(
        (b) => b.status === 'COMPLETED'
      ).length
      previousPeriodStats.totalRevenue = previousPeriodBookings
        .filter((b) => b.payment?.status === 'PAID')
        .reduce((sum, b) => sum + (b.payment?.tutorPayout || 0), 0)
      previousPeriodStats.totalHours = Math.floor(
        previousPeriodBookings
          .filter((b) => b.status === 'COMPLETED')
          .reduce((sum, b) => sum + b.duration, 0) / 60
      )

      // Get unique students
      const uniqueStudents = new Set(allBookings.map((b) => b.studentId))
      stats.totalStudents = uniqueStudents.size
    }
  } else if (session.user.role === 'PARENT') {
    const allBookings = await prisma.booking.findMany({
      where: { studentId: session.user.id },
      include: { payment: true },
    })

    const currentPeriodBookings = allBookings.filter(
      (b) => new Date(b.createdAt) >= currentMonthStart
    )
    const previousPeriodBookings = allBookings.filter(
      (b) =>
        new Date(b.createdAt) >= previousMonthStart &&
        new Date(b.createdAt) <= previousMonthEnd
    )

    stats.totalBookings = allBookings.length
    stats.completedBookings = allBookings.filter((b) => b.status === 'COMPLETED').length
    stats.pendingBookings = allBookings.filter((b) => b.status === 'PENDING').length
    stats.cancelledBookings = allBookings.filter((b) => b.status === 'CANCELLED').length
    stats.totalRevenue = allBookings
      .filter((b) => b.payment?.status === 'PAID')
      .reduce((sum, b) => sum + b.price, 0)
    stats.totalHours = Math.floor(
      allBookings
        .filter((b) => b.status === 'COMPLETED')
        .reduce((sum, b) => sum + b.duration, 0) / 60
    )

    // Previous period stats
    previousPeriodStats.totalBookings = previousPeriodBookings.length
    previousPeriodStats.completedBookings = previousPeriodBookings.filter(
      (b) => b.status === 'COMPLETED'
    ).length
    previousPeriodStats.totalRevenue = previousPeriodBookings
      .filter((b) => b.payment?.status === 'PAID')
      .reduce((sum, b) => sum + b.price, 0)
    previousPeriodStats.totalHours = Math.floor(
      previousPeriodBookings
        .filter((b) => b.status === 'COMPLETED')
        .reduce((sum, b) => sum + b.duration, 0) / 60
    )
  }

  // Calculate percentage changes
  const calculateChange = (current: number, previous: number): { value: string; trend: 'up' | 'down' | 'neutral' } => {
    if (previous === 0) {
      if (current === 0) return { value: '0%', trend: 'neutral' }
      return { value: '100%', trend: 'up' }
    }
    const change = ((current - previous) / previous) * 100
    if (Math.abs(change) < 0.1) return { value: '0%', trend: 'neutral' }
    return {
      value: `${change > 0 ? '+' : ''}${change.toFixed(1)}%`,
      trend: change > 0 ? 'up' : 'down',
    }
  }

  const bookingsChange = calculateChange(
    stats.totalBookings,
    previousPeriodStats.totalBookings
  )
  const completedChange = calculateChange(
    stats.completedBookings,
    previousPeriodStats.completedBookings
  )
  const revenueChange = calculateChange(
    stats.totalRevenue,
    previousPeriodStats.totalRevenue
  )
  const hoursChange = calculateChange(stats.totalHours, previousPeriodStats.totalHours)

  // Calculate real monthly data from bookings
  const monthlyDataPromises = Array.from({ length: 6 }, async (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - (5 - i))
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)

    let monthBookings: any[] = []
    if (session.user.role === 'TUTOR' && tutorProfile) {
      monthBookings = await prisma.booking.findMany({
        where: {
          tutorId: tutorProfile.id,
          scheduledAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        include: { payment: true },
      })
    } else if (session.user.role === 'PARENT') {
      monthBookings = await prisma.booking.findMany({
        where: {
          studentId: session.user.id,
          scheduledAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        include: { payment: true },
      })
    }

    const bookings = monthBookings.length
    const revenue = monthBookings
      .filter((b) => b.payment?.status === 'PAID')
      .reduce((sum, b) => {
        if (session.user.role === 'TUTOR') {
          return sum + (b.payment?.tutorPayout || 0)
        } else {
          return sum + b.price
        }
      }, 0)

    return {
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      bookings,
      revenue: Math.round(revenue),
    }
  })

  const monthlyData = await Promise.all(monthlyDataPromises)

  // Calculate max values for chart scaling
  const maxBookings = Math.max(...monthlyData.map((d) => d.bookings), 1)
  const maxRevenue = Math.max(...monthlyData.map((d) => d.revenue), 1)

  // Prepare activities for RecentActivity component
  let allBookings: any[] = []
  let payments: any[] = []
  let reviews: any[] = []

  if (session.user.role === 'TUTOR' && tutorProfile) {
    allBookings = await prisma.booking.findMany({
      where: { tutorId: tutorProfile.id },
      include: { payment: true, student: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })
    payments = allBookings
      .filter((b) => b.payment?.status === 'PAID')
      .map((b) => b.payment)
      .filter(Boolean)
    reviews = await prisma.review.findMany({
      where: { tutorId: tutorProfile.id },
      include: { student: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })
  } else if (session.user.role === 'PARENT') {
    allBookings = await prisma.booking.findMany({
      where: { studentId: session.user.id },
      include: {
        payment: true,
        tutor: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })
    payments = allBookings
      .filter((b) => b.payment?.status === 'PAID')
      .map((b) => b.payment)
      .filter(Boolean)
  }

  const activities = [
    ...payments.slice(0, 3).map((payment: any) => ({
      id: `payment-${payment.id}`,
      type: 'payment' as const,
      title: 'Payment Received',
      description: `₵${payment.amount.toFixed(2)} for ${payment.booking?.subject || 'lesson'}`,
      timestamp: payment.paidAt || payment.createdAt,
      link: `/bookings/${payment.bookingId}`,
    })),
    ...allBookings
      .filter((b) => b.status === 'CONFIRMED')
      .slice(0, 3)
      .map((booking: any) => ({
        id: `booking-${booking.id}`,
        type: 'booking_confirmed' as const,
        title: 'Booking Confirmed',
        description: `${booking.subject} on ${new Date(booking.scheduledAt).toLocaleDateString()}`,
        timestamp: booking.updatedAt,
        link: `/bookings/${booking.id}`,
      })),
    ...reviews.slice(0, 2).map((review: any) => ({
      id: `review-${review.id}`,
      type: 'review' as const,
      title: 'New Review',
      description: `${review.rating} stars from ${review.student?.name || 'Student'}`,
      timestamp: review.createdAt,
      link: session.user.role === 'TUTOR' ? `/tutor/${tutorProfile?.id}` : '#',
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  const statCards = [
    {
      title: 'Total Bookings',
      value: stats.totalBookings.toString(),
      change: bookingsChange.value,
      trend: bookingsChange.trend,
      icon: BookOpen,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Completed Lessons',
      value: stats.completedBookings.toString(),
      change: completedChange.value,
      trend: completedChange.trend,
      icon: Clock,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Total Revenue',
      value: `₵${stats.totalRevenue.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: revenueChange.value,
      trend: revenueChange.trend,
      icon: DollarSign,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: session.user.role === 'TUTOR' ? 'Average Rating' : 'Total Hours',
      value:
        session.user.role === 'TUTOR'
          ? stats.averageRating > 0
            ? `${stats.averageRating.toFixed(1)} ⭐`
            : 'N/A'
          : `${stats.totalHours}h`,
      change: session.user.role === 'TUTOR' ? (stats.averageRating > 0 ? '—' : '—') : hoursChange.value,
      trend: session.user.role === 'TUTOR' ? 'neutral' : hoursChange.trend,
      icon: session.user.role === 'TUTOR' ? Star : Clock,
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-50',
    },
  ]

  // Calculate completion rate
  const completionRate =
    stats.totalBookings > 0
      ? ((stats.completedBookings / stats.totalBookings) * 100).toFixed(1)
      : '0'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Analytics</h1>
              <p className="text-gray-600 text-lg">Track your performance and insights</p>
            </div>
            <Link
              href="/dashboard"
              className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-lg shadow-sm hover:shadow-md transition-all border border-gray-200"
            >
              <ArrowUpRight className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, idx) => {
            const Icon = stat.icon
            return (
              <div
                key={idx}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 border border-gray-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-md`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div
                    className={`flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-full ${
                      stat.trend === 'up'
                        ? 'text-green-700 bg-green-100'
                        : stat.trend === 'down'
                        ? 'text-red-700 bg-red-100'
                        : 'text-gray-700 bg-gray-100'
                    }`}
                  >
                    {stat.trend === 'up' ? (
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    ) : stat.trend === 'down' ? (
                      <ArrowDownRight className="h-3.5 w-3.5" />
                    ) : null}
                    {stat.change}
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">{stat.title}</h3>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
            )
          })}
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Completion Rate</h3>
              <Target className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{completionRate}%</p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.completedBookings} of {stats.totalBookings} completed
            </p>
          </div>

          {session.user.role === 'TUTOR' && (
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Total Students</h3>
                <Users className="h-5 w-5 text-purple-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
              <p className="text-xs text-gray-500 mt-1">Unique students taught</p>
            </div>
          )}

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Pending Bookings</h3>
              <Clock className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.pendingBookings}</p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.cancelledBookings > 0 && `${stats.cancelledBookings} cancelled`}
            </p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Bookings Chart */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Bookings Overview</h2>
              <span className="text-xs text-gray-500">Last 6 months</span>
            </div>
            {maxBookings > 0 ? (
              <div className="h-64 flex items-end justify-between gap-2">
                {monthlyData.map((data, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center group">
                    <div className="w-full flex flex-col items-center justify-end h-full relative">
                      <div
                        className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg mb-1 transition-all hover:opacity-90 cursor-pointer group-hover:from-blue-600 group-hover:to-blue-500"
                        style={{
                          height: `${Math.max((data.bookings / maxBookings) * 100, 5)}%`,
                          minHeight: data.bookings > 0 ? '8px' : '0px',
                        }}
                        title={`${data.bookings} bookings in ${data.month}`}
                      />
                      {data.bookings > 0 && (
                        <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                          {data.bookings}
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-medium text-gray-600 mt-2">{data.month}</span>
                    <span className="text-xs font-semibold text-gray-900 mt-1">{data.bookings}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No bookings data available</p>
                </div>
              </div>
            )}
          </div>

          {/* Revenue Chart */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Revenue Overview</h2>
              <span className="text-xs text-gray-500">Last 6 months</span>
            </div>
            {maxRevenue > 0 ? (
              <div className="h-64 flex items-end justify-between gap-2">
                {monthlyData.map((data, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center group">
                    <div className="w-full flex flex-col items-center justify-end h-full relative">
                      <div
                        className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg mb-1 transition-all hover:opacity-90 cursor-pointer group-hover:from-green-600 group-hover:to-green-500"
                        style={{
                          height: `${Math.max((data.revenue / maxRevenue) * 100, 5)}%`,
                          minHeight: data.revenue > 0 ? '8px' : '0px',
                        }}
                        title={`₵${data.revenue.toLocaleString()} in ${data.month}`}
                      />
                      {data.revenue > 0 && (
                        <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                          ₵{data.revenue.toLocaleString()}
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-medium text-gray-600 mt-2">{data.month}</span>
                    <span className="text-xs font-semibold text-gray-900 mt-1">
                      ₵{data.revenue.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No revenue data available</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <RecentActivity activities={activities} />
      </div>
    </div>
  )
}
