import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
  FileText,
} from 'lucide-react'

export default async function LessonsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  const statusFilter = searchParams.status as string | undefined

  // Fetch lessons based on user role
  let bookings: any[] = []
  let tutorProfile = null

  if (session.user.role === 'PARENT') {
    const where: any = {
      studentId: session.user.id,
    }

    if (statusFilter && statusFilter !== 'all') {
      where.status = statusFilter.toUpperCase()
    }

    bookings = await prisma.booking.findMany({
      where,
      include: {
        tutor: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        payment: true,
        review: true,
      },
      orderBy: {
        scheduledAt: 'desc',
      },
    })
  } else if (session.user.role === 'TUTOR') {
    tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId: session.user.id },
    })

    const where: any = {
      tutorId: tutorProfile?.id || '',
    }

    if (statusFilter && statusFilter !== 'all') {
      where.status = statusFilter.toUpperCase()
    }

    bookings = await prisma.booking.findMany({
      where,
      include: {
        student: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
        payment: true,
        review: true,
      },
      orderBy: {
        scheduledAt: 'desc',
      },
    })
  }

  const statusCounts = {
    all: bookings.length,
    pending: bookings.filter((b) => b.status === 'PENDING').length,
    confirmed: bookings.filter((b) => b.status === 'CONFIRMED').length,
    completed: bookings.filter((b) => b.status === 'COMPLETED').length,
    cancelled: bookings.filter((b) => b.status === 'CANCELLED').length,
  }

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

  const canJoinLesson = (booking: any) => {
    const now = new Date()
    const scheduledTime = new Date(booking.scheduledAt)
    const timeDiff = scheduledTime.getTime() - now.getTime()
    const minutesUntil = timeDiff / (1000 * 60)

    return (
      booking.status === 'CONFIRMED' &&
      booking.lessonType === 'ONLINE' &&
      minutesUntil <= 15 &&
      minutesUntil >= -booking.duration
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Lessons</h1>
          <p className="text-gray-600">
            {session.user.role === 'PARENT'
              ? 'View and manage your booked lessons'
              : 'View and manage your tutoring sessions'}
          </p>
        </div>

        {/* Status Filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          <Link
            href="/lessons"
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              !statusFilter || statusFilter === 'all'
                ? 'bg-pink-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            All ({statusCounts.all})
          </Link>
          <Link
            href="/lessons?status=pending"
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === 'pending'
                ? 'bg-pink-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            Pending ({statusCounts.pending})
          </Link>
          <Link
            href="/lessons?status=confirmed"
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === 'confirmed'
                ? 'bg-pink-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            Confirmed ({statusCounts.confirmed})
          </Link>
          <Link
            href="/lessons?status=completed"
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === 'completed'
                ? 'bg-pink-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            Completed ({statusCounts.completed})
          </Link>
          <Link
            href="/lessons?status=cancelled"
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === 'cancelled'
                ? 'bg-pink-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            Cancelled ({statusCounts.cancelled})
          </Link>
        </div>

        {/* Lessons List */}
        {bookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No lessons found</h3>
            <p className="text-gray-600 mb-6">
              {statusFilter
                ? `No lessons with status "${statusFilter}"`
                : 'You don\'t have any lessons yet.'}
            </p>
            {session.user.role === 'PARENT' && (
              <Link
                href="/search"
                className="inline-block px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium"
              >
                Find a Tutor
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const otherPerson =
                session.user.role === 'PARENT'
                  ? booking.tutor.user
                  : booking.student
              const canJoin = canJoinLesson(booking)

              return (
                <div
                  key={booking.id}
                  className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Left Section */}
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                          {otherPerson.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-800">
                              {otherPerson.name}
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
                          <p className="text-gray-600 font-medium mb-3">{booking.subject}</p>
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
                          </div>
                          {booking.notes && (
                            <div className="mt-3 flex items-start gap-2">
                              <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
                              <p className="text-sm text-gray-600">{booking.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Section */}
                    <div className="flex flex-col items-end gap-3">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          ${booking.price.toFixed(2)}
                        </p>
                        {booking.payment && (
                          <p
                            className={`text-xs mt-1 ${
                              booking.payment.status === 'PAID'
                                ? 'text-green-600'
                                : 'text-yellow-600'
                            }`}
                          >
                            Payment: {booking.payment.status}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {canJoin && (
                          <Link
                            href={`/lessons/${booking.id}`}
                            className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium flex items-center gap-2"
                          >
                            <Play className="h-4 w-4" />
                            Join Lesson
                          </Link>
                        )}
                        {booking.status === 'COMPLETED' && !booking.review && session.user.role === 'PARENT' && (
                          <Link
                            href={`/bookings/${booking.id}/review`}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                          >
                            Leave Review
                          </Link>
                        )}
                        <Link
                          href={`/lessons/${booking.id}`}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

