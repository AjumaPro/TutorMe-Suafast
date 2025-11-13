import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import DashboardSidebar from '@/components/DashboardSidebar'
import { supabase } from '@/lib/supabase-db'
import TutoringSchedule from '@/components/TutoringSchedule'
import RecordedSessions from '@/components/RecordedSessions'
import SummaryStats from '@/components/SummaryStats'
import LearningProgress from '@/components/LearningProgress'
import OpenSeminars from '@/components/OpenSeminars'
import Assignments from '@/components/Assignments'
import UserProfileCard from '@/components/UserProfileCard'
import Discussions from '@/components/Discussions'
import UpcomingVideoSessions from '@/components/UpcomingVideoSessions'
import StartLiveSession from '@/components/StartLiveSession'
import RecentActivity from '@/components/RecentActivity'
import QuickActions from '@/components/QuickActions'
import EarningsSummary from '@/components/EarningsSummary'
import UpcomingReminders from '@/components/UpcomingReminders'
import AchievementBadges from '@/components/AchievementBadges'
import RecentBookings from '@/components/RecentBookings'
import PerformanceMetrics from '@/components/PerformanceMetrics'
import Link from 'next/link'
import { TrendingUp, Clock, Users, Award, Zap, Target } from 'lucide-react'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  // Fetch user-specific data
  let allBookings: any[] = []
  let tutorProfile = null
  let completedBookings: any[] = []
  let totalHours = 0
  let totalMinutes = 0
  let payments: any[] = []
  let reviews: any[] = []
  let notifications: any[] = []

  if (session.user.role === 'PARENT') {
    const { data: bookingsData } = await supabase
      .from('bookings')
      .select('*')
      .eq('studentId', session.user.id)
      .order('scheduledAt', { ascending: true })
    
    allBookings = bookingsData || []
    
    // Fetch related data
    for (const booking of allBookings) {
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
              .select('*')
              .eq('id', tutor.userId)
              .single()
            booking.tutor.user = tutorUser || null
          }
        }
      }
      if (booking.id) {
        const { data: videoSession } = await supabase
          .from('video_sessions')
          .select('*')
          .eq('bookingId', booking.id)
          .single()
        booking.videoSession = videoSession ? {
          sessionToken: videoSession.sessionToken,
          status: videoSession.status,
        } : null
      }
    }

    completedBookings = allBookings.filter((b) => b.status === 'COMPLETED')
    totalHours = Math.floor(
      completedBookings.reduce((sum, b) => sum + b.duration, 0) / 60
    )
    totalMinutes = completedBookings.reduce((sum, b) => sum + b.duration, 0) % 60

    // Fetch payments for parent - get bookings first, then payments
    const { data: parentBookings } = await supabase
      .from('bookings')
      .select('*')
      .eq('studentId', session.user.id)
    
    const bookingIds = (parentBookings || []).map((b: any) => b.id)
    if (bookingIds.length > 0) {
      const { data: allPayments } = await supabase
        .from('payments')
        .select('*')
        .order('createdAt', { ascending: false })
        .limit(50)
      
      payments = (allPayments || [])
        .filter((p: any) => bookingIds.includes(p.bookingId))
        .slice(0, 10)
        .map(async (p: any) => {
          const { data: booking } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', p.bookingId)
            .single()
          
          if (booking) {
            p.booking = booking
            if (booking.tutorId) {
              const { data: tutor } = await supabase
                .from('tutor_profiles')
                .select('*')
                .eq('id', booking.tutorId)
                .single()
              
              if (tutor) {
                p.booking.tutor = tutor
                if (tutor.userId) {
                  const { data: tutorUser } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', tutor.userId)
                    .single()
                  p.booking.tutor.user = tutorUser ? { name: tutorUser.name } : null
                }
              }
            }
          }
          return p
        })
      
      payments = await Promise.all(payments)
    }

    // Fetch notifications
    const { data: notificationsData } = await supabase
      .from('notifications')
      .select('*')
      .eq('userId', session.user.id)
      .order('createdAt', { ascending: false })
      .limit(10)
    
    notifications = notificationsData || []
  } else if (session.user.role === 'TUTOR') {
    const { data: tutorProfileData } = await supabase
      .from('tutor_profiles')
      .select('*')
      .eq('userId', session.user.id)
      .single()
    
    tutorProfile = tutorProfileData || null
    
    if (tutorProfile && tutorProfile.userId) {
      const { data: tutorUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', tutorProfile.userId)
        .single()
      tutorProfile.user = tutorUser || null
    }

    // Only fetch bookings if tutor profile exists
    if (tutorProfile?.id) {
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('*')
        .eq('tutorId', tutorProfile.id)
        .order('scheduledAt', { ascending: true })
      
      allBookings = bookingsData || []
      
      // Fetch related data
      for (const booking of allBookings) {
        if (booking.studentId) {
          const { data: student } = await supabase
            .from('users')
            .select('*')
            .eq('id', booking.studentId)
            .single()
          booking.student = student ? {
            name: student.name,
            email: student.email,
          } : null
        }
        if (booking.id) {
          const { data: videoSession } = await supabase
            .from('video_sessions')
            .select('*')
            .eq('bookingId', booking.id)
            .single()
          booking.videoSession = videoSession ? {
            sessionToken: videoSession.sessionToken,
            status: videoSession.status,
          } : null
        }
      }
    }

    completedBookings = allBookings.filter((b) => b.status === 'COMPLETED')
    totalHours = Math.floor(
      completedBookings.reduce((sum, b) => sum + b.duration, 0) / 60
    )
    totalMinutes = completedBookings.reduce((sum, b) => sum + b.duration, 0) % 60

    // Fetch payments for tutor
    if (tutorProfile?.id) {
      // Get tutor bookings first
      const { data: tutorBookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('tutorId', tutorProfile.id)
      
      const bookingIds = (tutorBookings || []).map((b: any) => b.id)
      if (bookingIds.length > 0) {
        const { data: allPayments } = await supabase
          .from('payments')
          .select('*')
          .order('createdAt', { ascending: false })
          .limit(50)
        
        payments = (allPayments || [])
          .filter((p: any) => bookingIds.includes(p.bookingId))
          .slice(0, 10)
          .map(async (p: any) => {
            const { data: booking } = await supabase
              .from('bookings')
              .select('*')
              .eq('id', p.bookingId)
              .single()
            
            if (booking && booking.studentId) {
              const { data: student } = await supabase
                .from('users')
                .select('*')
                .eq('id', booking.studentId)
                .single()
              p.booking = {
                ...booking,
                student: student ? { name: student.name } : null,
              }
            }
            return p
          })
        
        payments = await Promise.all(payments)
      }

      // Fetch reviews for tutor
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*')
        .eq('tutorId', tutorProfile.id)
        .order('createdAt', { ascending: false })
        .limit(5)
      
      reviews = reviewsData || []
      
      // Fetch student names for reviews
      for (const review of reviews) {
        if (review.studentId) {
          const { data: student } = await supabase
            .from('users')
            .select('*')
            .eq('id', review.studentId)
            .single()
          review.student = student ? { name: student.name } : null
        }
      }
    }

    // Fetch notifications
    const { data: notificationsData } = await supabase
      .from('notifications')
      .select('*')
      .eq('userId', session.user.id)
      .order('createdAt', { ascending: false })
      .limit(10)
    
    notifications = notificationsData || []
  }

  // Calculate weekly progress data from actual bookings
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const currentDate = new Date()
  const weeklyData = dayNames.map((day, index) => {
    const dayOfWeek = index === 0 ? 6 : index - 1 // Sunday = 6, Monday = 0, etc.
    const weekStart = new Date(currentDate)
    weekStart.setDate(currentDate.getDate() - currentDate.getDay()) // Start of current week (Sunday)
    
    const dayDate = new Date(weekStart)
    dayDate.setDate(weekStart.getDate() + dayOfWeek)
    
    // Count completed bookings for this day
    const dayBookings = completedBookings.filter((b) => {
      const bookingDate = new Date(b.scheduledAt)
      return (
        bookingDate.getDate() === dayDate.getDate() &&
        bookingDate.getMonth() === dayDate.getMonth() &&
        bookingDate.getFullYear() === dayDate.getFullYear()
      )
    })
    
    const hours = dayBookings.reduce((sum, b) => sum + b.duration, 0) / 60
    // Focus score based on number of lessons (simplified)
    const focus = Math.min(100, (dayBookings.length / 3) * 100)
    
    return { day, focus, hours }
  })

  // Empty arrays for features not yet implemented
  const recordedSessions: any[] = [] // Video recording not yet implemented
  const assignments: any[] = [] // Assignment system not yet implemented
  const discussionsParticipants: any[] = [] // Discussions not yet implemented
  const discussionsMessages: any[] = [] // Discussions not yet implemented

  const totalClasses = completedBookings.length
  const totalShifts = allBookings.filter(
    (b) => b.status === 'CONFIRMED' || b.status === 'PENDING'
  ).length
  const totalHoursFormatted = `${totalHours}h ${totalMinutes}m`

  // Get upcoming video sessions (ONLINE, CONFIRMED or COMPLETED, scheduled in future or recent past)
  const now = new Date()
  const upcomingVideoSessions = allBookings
    .filter((booking) => {
      const scheduled = new Date(booking.scheduledAt)
      const timeDiff = scheduled.getTime() - now.getTime()
      const minutesUntil = timeDiff / (1000 * 60)
      const durationMinutes = booking.duration

      return (
        booking.lessonType === 'ONLINE' &&
        (booking.status === 'CONFIRMED' || booking.status === 'COMPLETED') &&
        minutesUntil >= -durationMinutes && // Within lesson duration window
        minutesUntil <= 24 * 60 // Up to 24 hours in the future
      )
    })
    .map((booking) => ({
      id: booking.id,
      bookingId: booking.id,
      scheduledAt: booking.scheduledAt,
      subject: booking.subject,
      duration: booking.duration,
      lessonType: booking.lessonType,
      status: booking.status,
      otherPerson:
        session.user.role === 'PARENT'
          ? {
              name: booking.tutor?.user?.name || 'Unknown Tutor',
              email: booking.tutor?.user?.email || '',
            }
          : {
              name: booking.student?.name || 'Unknown Student',
              email: booking.student?.email || '',
            },
    }))
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())

  // Prepare activity feed
  const activities = [
    ...payments
      .filter((p) => p.status === 'PAID')
      .slice(0, 3)
      .map((payment) => ({
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
      .map((booking) => ({
        id: `booking-${booking.id}`,
        type: 'booking_confirmed' as const,
        title: 'Booking Confirmed',
        description: `${booking.subject} on ${new Date(booking.scheduledAt).toLocaleDateString()}`,
        timestamp: booking.updatedAt,
        link: `/bookings/${booking.id}`,
      })),
    ...reviews.slice(0, 2).map((review) => ({
      id: `review-${review.id}`,
      type: 'review' as const,
      title: 'New Review',
      description: `${review.rating} stars from ${review.student?.name || 'Student'}`,
      timestamp: review.createdAt,
      link: session.user.role === 'TUTOR' ? `/tutor/${tutorProfile?.id}` : '#',
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  // Prepare reminders
  const reminders = [
    ...allBookings
      .filter((b) => {
        const scheduled = new Date(b.scheduledAt)
        const now = new Date()
        const hoursUntil = (scheduled.getTime() - now.getTime()) / (1000 * 60 * 60)
        return b.status === 'CONFIRMED' && hoursUntil > 0 && hoursUntil <= 24
      })
      .map((booking) => ({
        id: `reminder-${booking.id}`,
        type: 'booking' as const,
        title: `Upcoming Lesson: ${booking.subject}`,
        description:
          session.user.role === 'PARENT'
            ? `With ${booking.tutor?.user?.name || 'Tutor'}`
            : `With ${booking.student?.name || 'Student'}`,
        dueDate: new Date(booking.scheduledAt),
        link: `/bookings/${booking.id}`,
        priority: 'high' as const,
      })),
    ...payments
      .filter((p) => p.status === 'PENDING')
      .map((payment) => {
        // Convert createdAt string to Date if needed
        const createdAt = payment.createdAt instanceof Date 
          ? payment.createdAt 
          : new Date(payment.createdAt)
        
        return {
          id: `payment-reminder-${payment.id}`,
          type: 'payment' as const,
          title: 'Payment Pending',
          description: `Complete payment for ${payment.booking?.subject || 'lesson'}`,
          dueDate: new Date(createdAt.getTime() + 24 * 60 * 60 * 1000), // 24 hours from creation
          link: `/bookings/${payment.bookingId}/payment`,
          priority: 'medium' as const,
        }
      }),
  ]

  // Calculate earnings for tutors
  const totalEarnings =
    session.user.role === 'TUTOR' && tutorProfile
      ? payments
          .filter((p) => p.status === 'PAID')
          .reduce((sum, p) => sum + (p.tutorPayout || 0), 0)
      : 0

  const thisMonth = new Date()
  thisMonth.setDate(1)
  const thisMonthEarnings =
    session.user.role === 'TUTOR' && tutorProfile
      ? payments
          .filter(
            (p) =>
              p.status === 'PAID' &&
              p.paidAt &&
              new Date(p.paidAt) >= thisMonth
          )
          .reduce((sum, p) => sum + (p.tutorPayout || 0), 0)
      : 0

  const lastMonth = new Date()
  lastMonth.setMonth(lastMonth.getMonth() - 1)
  lastMonth.setDate(1)
  const lastMonthEnd = new Date()
  lastMonthEnd.setDate(0)
  const lastMonthEarnings =
    session.user.role === 'TUTOR' && tutorProfile
      ? payments
          .filter(
            (p) =>
              p.status === 'PAID' &&
              p.paidAt &&
              new Date(p.paidAt) >= lastMonth &&
              new Date(p.paidAt) <= lastMonthEnd
          )
          .reduce((sum, p) => sum + (p.tutorPayout || 0), 0)
      : 0

  const pendingPayout =
    session.user.role === 'TUTOR' && tutorProfile
      ? payments
          .filter((p) => p.status === 'PENDING')
          .reduce((sum, p) => sum + (p.tutorPayout || 0), 0)
      : 0

  // Prepare achievement badges
  const badges = [
    {
      id: 'first-lesson',
      name: 'First Lesson',
      description: 'Complete your first lesson',
      iconType: 'zap' as const,
      earned: completedBookings.length >= 1,
      color: 'text-yellow-500',
    },
    {
      id: '10-lessons',
      name: '10 Lessons',
      description: 'Complete 10 lessons',
      iconType: 'target' as const,
      earned: completedBookings.length >= 10,
      progress: Math.min(100, (completedBookings.length / 10) * 100),
      color: 'text-blue-500',
    },
    {
      id: '50-hours',
      name: '50 Hours',
      description: 'Complete 50 hours of lessons',
      iconType: 'clock' as const,
      earned: totalHours >= 50,
      progress: Math.min(100, (totalHours / 50) * 100),
      color: 'text-green-500',
    },
    {
      id: 'top-tutor',
      name: 'Top Tutor',
      description: 'Get 10 five-star reviews',
      iconType: 'award' as const,
      earned: session.user.role === 'TUTOR' && reviews.filter((r) => r.rating === 5).length >= 10,
      progress: session.user.role === 'TUTOR' ? Math.min(100, (reviews.filter((r) => r.rating === 5).length / 10) * 100) : 0,
      color: 'text-purple-500',
    },
  ]

  // Prepare performance metrics
  const performanceMetrics = [
    {
      label: 'Completion Rate',
      value: `${allBookings.length > 0 ? Math.round((completedBookings.length / allBookings.length) * 100) : 0}%`,
      change: allBookings.length > 0 ? 5 : 0,
      icon: <Target className="h-5 w-5" />,
      color: 'text-blue-500 bg-blue-100',
    },
    {
      label: 'Avg Rating',
      value:
        reviews.length > 0
          ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
          : 'N/A',
      change: reviews.length > 0 ? 2 : 0,
      icon: <Award className="h-5 w-5" />,
      color: 'text-yellow-500 bg-yellow-100',
    },
    {
      label: 'Response Time',
      value: '< 2h',
      change: -10,
      icon: <Zap className="h-5 w-5" />,
      color: 'text-green-500 bg-green-100',
    },
    {
      label: session.user.role === 'TUTOR' ? 'Active Students' : 'Active Tutors',
      value: allBookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'PENDING').length,
      change: 12,
      icon: <Users className="h-5 w-5" />,
      color: 'text-purple-500 bg-purple-100',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col lg:ml-0">
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-4 space-y-6">
                <QuickActions />
                <UpcomingVideoSessions
                  sessions={upcomingVideoSessions}
                  userRole={session.user.role}
                />
                <RecentBookings
                  bookings={allBookings
                    .slice(0, 5)
                    .map((b) => ({
                      id: b.id,
                      subject: b.subject,
                      scheduledAt: b.scheduledAt,
                      duration: b.duration,
                      lessonType: b.lessonType,
                      status: b.status,
                      tutorName: b.tutor?.user?.name,
                      studentName: b.student?.name,
                      isRecurring: b.isRecurring,
                    }))}
                  userRole={session.user.role}
                />
                <TutoringSchedule
                  bookings={allBookings.map((b) => ({
                    id: b.id,
                    scheduledAt: b.scheduledAt,
                    subject: b.subject,
                  }))}
                />
                <RecordedSessions sessions={recordedSessions} />
              </div>

              {/* Middle Column */}
              <div className="lg:col-span-5 space-y-6">
                <SummaryStats
                  totalClasses={totalClasses}
                  totalHours={totalHoursFormatted}
                  totalShifts={totalShifts}
                />
                {session.user.role === 'TUTOR' && (
                  <EarningsSummary
                    totalEarnings={totalEarnings}
                    thisMonth={thisMonthEarnings}
                    lastMonth={lastMonthEarnings}
                    pendingPayout={pendingPayout}
                  />
                )}
                <LearningProgress 
                  improvement={completedBookings.length > 0 ? Math.min(100, Math.round((completedBookings.length / Math.max(1, allBookings.length)) * 100)) : 0} 
                  weeklyData={weeklyData} 
                />
                <PerformanceMetrics metrics={performanceMetrics} />
                <RecentActivity activities={activities} />
                <UpcomingReminders reminders={reminders} />
                <OpenSeminars seminars={[]} />
                <Assignments assignments={assignments} />
              </div>

              {/* Right Column */}
              <div className="lg:col-span-3 space-y-6">
                <UserProfileCard user={session.user} />
                {session.user.role === 'TUTOR' && (
                  <StartLiveSession />
                )}
                <AchievementBadges badges={badges} />
                <Link
                  href="/tutor/profile"
                  className="block bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg mb-1">Complete your profile</h3>
                      <p className="text-green-50 text-sm">Get free 1h session</p>
                    </div>
                    <TrendingUp className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
                <Discussions
                  participants={discussionsParticipants}
                  messages={discussionsMessages}
                  currentUserId={session.user.id}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
