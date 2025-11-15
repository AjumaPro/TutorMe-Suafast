import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase-db'
import { formatCurrency, parseCurrencyCode } from '@/lib/currency'
import { Calendar, Clock, MapPin, Video, User, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import TutoringSchedule from '@/components/TutoringSchedule'

export default async function SchedulePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  // Fetch bookings based on user role
  let bookings: any[] = []
  let tutorProfile = null

  if (session.user.role === 'ADMIN') {
    // Admin sees all bookings in the system
    const { data: bookingsData } = await supabase
      .from('bookings')
      .select('*')
      .order('scheduledAt', { ascending: true })
    
    bookings = bookingsData || []
    
    // Import security utilities
    const { sanitizeUser, sanitizeTutorProfile } = await import('@/lib/security')

    // Fetch related tutor, student, and user data
    for (const booking of bookings) {
      // Fetch tutor data
      if (booking.tutorId) {
        const { data: tutor } = await supabase
          .from('tutor_profiles')
          .select('*')
          .eq('id', booking.tutorId)
          .single()
        
        if (tutor) {
          booking.tutor = sanitizeTutorProfile(tutor, 'admin') // Admin can see all tutor data
          if (tutor.userId) {
            const { data: tutorUser } = await supabase
              .from('users')
              .select('*')
              .eq('id', tutor.userId)
              .single()
            // Admin can see tutor emails for management purposes
            booking.tutor.user = tutorUser ? sanitizeUser(
              tutorUser,
              'admin',
              true, // Admin can see email
              false // Don't need phone
            ) : null
          }
        }
      }
      
      // Fetch student data
      if (booking.studentId) {
        const { data: student } = await supabase
          .from('users')
          .select('*')
          .eq('id', booking.studentId)
          .single()
        // Admin can see student emails for management purposes
        booking.student = student ? sanitizeUser(
          student,
          'admin',
          true, // Admin can see email
          false // Don't need phone in schedule view
        ) : null
      }
    }
  } else if (session.user.role === 'PARENT') {
    const { data: bookingsData } = await supabase
      .from('bookings')
      .select('*')
      .eq('studentId', session.user.id)
      .order('scheduledAt', { ascending: true })
    
    bookings = bookingsData || []
    
    // Fetch related tutor and user data
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
              .select('*')
              .eq('id', tutor.userId)
              .single()
            booking.tutor.user = tutorUser || null
          }
        }
      }
    }
  } else if (session.user.role === 'TUTOR') {
    const { data: tutorProfileData } = await supabase
      .from('tutor_profiles')
      .select('*')
      .eq('userId', session.user.id)
      .single()
    
    tutorProfile = tutorProfileData || null

    if (tutorProfile?.id) {
      // Fetch all bookings for this tutor (both student-booked and admin-assigned)
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('*')
        .eq('tutorId', tutorProfile.id)
        .order('scheduledAt', { ascending: true })
      
      bookings = bookingsData || []
      
      // Fetch related student data
      for (const booking of bookings) {
        if (booking.studentId) {
          const { data: student } = await supabase
            .from('users')
            .select('name, email, image')
            .eq('id', booking.studentId)
            .single()
          booking.student = student || null
        }
      }
    }
  }

  // Group bookings by date
  const bookingsByDate = bookings.reduce((acc, booking) => {
    const date = new Date(booking.scheduledAt).toDateString()
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(booking)
    return acc
  }, {} as Record<string, typeof bookings>)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <CheckCircle className="h-4 w-4" />
      case 'CANCELLED':
        return <XCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Schedule</h1>
          <p className="text-gray-600">Manage your lessons and appointments</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar View */}
          <div className="lg:col-span-2 space-y-6">
            {/* Calendar Component */}
            <TutoringSchedule
              bookings={bookings.map((b) => ({
                id: b.id,
                scheduledAt: b.scheduledAt,
                subject: b.subject,
              }))}
            />

            {/* Upcoming Lessons List */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  {session.user.role === 'ADMIN' ? 'All Bookings' : 'Upcoming Lessons'}
                </h2>
                {session.user.role === 'PARENT' ? (
                  <Link
                    href="/search"
                    className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors text-sm font-medium inline-block"
                  >
                    + New Booking
                  </Link>
                ) : session.user.role === 'ADMIN' ? (
                  <Link
                    href="/admin?tab=tutors"
                    className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors text-sm font-medium inline-block"
                    title="Schedule a lesson from the admin panel"
                  >
                    Schedule Lesson
                  </Link>
                ) : (
                  <button
                    disabled
                    className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed text-sm font-medium"
                    title="Students book lessons with you or admin assigns them"
                  >
                    + New Booking
                  </button>
                )}
              </div>

              {Object.keys(bookingsByDate).length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-2">No scheduled lessons</p>
                  <p className="text-gray-400 text-sm">
                    {session.user.role === 'ADMIN'
                      ? 'No bookings in the system yet'
                      : session.user.role === 'PARENT'
                      ? 'Start by searching for a tutor'
                      : 'Your bookings (from students and admin assignments) will appear here'}
                  </p>
                  {session.user.role === 'PARENT' && (
                    <Link
                      href="/search"
                      className="inline-block mt-4 px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                    >
                      Find a Tutor
                    </Link>
                  )}
                  {session.user.role === 'ADMIN' && (
                    <Link
                      href="/admin?tab=tutors"
                      className="inline-block mt-4 px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                    >
                      Schedule a Lesson
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(bookingsByDate).map(([date, dateBookings]) => {
                    const bookings = dateBookings as any[]
                    return (
                    <div key={date}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-pink-600" />
                          <h3 className="font-semibold text-gray-800">
                            {new Date(date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </h3>
                        </div>
                        <span className="text-sm text-gray-500">
                          {bookings.length} {bookings.length === 1 ? 'lesson' : 'lessons'}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {bookings.map((booking) => (
                          <div
                            key={booking.id}
                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold text-gray-800">
                                    {session.user.role === 'ADMIN' ? (
                                      <>
                                        <span className="flex items-center gap-2">
                                          <User className="h-4 w-4 text-gray-500" />
                                          {booking.student?.name || 'Unknown Student'}
                                        </span>
                                        <span className="text-gray-400 mx-2">with</span>
                                        <span>{booking.tutor?.user?.name || 'Unknown Tutor'}</span>
                                      </>
                                    ) : session.user.role === 'PARENT' ? (
                                      booking.tutor?.user?.name || 'Unknown Tutor'
                                    ) : (
                                      booking.student?.name || 'Unknown Student'
                                    )}
                                  </h4>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(
                                      booking.status
                                    )}`}
                                  >
                                    {getStatusIcon(booking.status)}
                                    {booking.status}
                                  </span>
                                </div>
                                <p className="text-gray-600 mb-2">{booking.subject}</p>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    {new Date(booking.scheduledAt).toLocaleTimeString('en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                    {' - '}
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
                                  {session.user.role === 'ADMIN' && booking.tutor?.user?.email && (
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs text-gray-400">
                                        Tutor: {booking.tutor.user.email}
                                      </span>
                                    </div>
                                  )}
                                  {session.user.role === 'ADMIN' && booking.student?.email && (
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs text-gray-400">
                                        Student: {booking.student.email}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-lg text-gray-900">
                                  {formatCurrency(booking.price, parseCurrencyCode(booking.currency))}
                                </p>
                                {session.user.role === 'ADMIN' && (
                                  <Link
                                    href={`/lessons/${booking.id}`}
                                    className="text-xs text-pink-600 hover:text-pink-700 mt-1 inline-block"
                                  >
                                    View Details
                                  </Link>
                                )}
                              </div>
                            </div>
                            {booking.status === 'CONFIRMED' && booking.lessonType === 'ONLINE' && (
                              <Link
                                href={`/lessons/${booking.id}`}
                                className="inline-block mt-3 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors text-sm font-medium"
                              >
                                Join Lesson
                              </Link>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-semibold text-gray-800 mb-4">
                {session.user.role === 'ADMIN' ? 'System Overview' : 'This Week'}
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Scheduled</span>
                  <span className="font-bold text-gray-900">
                    {bookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'PENDING')
                      .length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Completed</span>
                  <span className="font-bold text-gray-900">
                    {bookings.filter((b) => b.status === 'COMPLETED').length}
                  </span>
                </div>
                {session.user.role === 'ADMIN' && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Bookings</span>
                    <span className="font-bold text-gray-900">{bookings.length}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Hours</span>
                  <span className="font-bold text-gray-900">
                    {Math.floor(
                      bookings
                        .filter((b) => b.status === 'COMPLETED')
                        .reduce((sum, b) => sum + b.duration, 0) / 60
                    )}
                    h
                  </span>
                </div>
                {session.user.role === 'TUTOR' && (
                  <div className="pt-4 border-t">
                    <p className="text-xs text-gray-500 mb-2">Your Students:</p>
                    <p className="font-semibold text-gray-800">
                      {new Set(bookings.map((b) => b.studentId).filter(Boolean)).size}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Availability */}
            {session.user.role === 'TUTOR' && (
              <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl shadow-md p-6 text-white">
                <h3 className="font-semibold mb-4">Manage Availability</h3>
                <p className="text-sm text-pink-100 mb-4">
                  Set your available hours for students to book lessons
                </p>
                <Link
                  href="/tutor/profile"
                  className="inline-block w-full text-center px-4 py-2 bg-white text-pink-600 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                >
                  Update Schedule
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

