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
  DollarSign,
  CreditCard,
} from 'lucide-react'

export default async function BookingsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  // Fetch bookings based on user role
  let bookings: any[] = []
  let tutorProfile = null

  if (session.user.role === 'PARENT') {
    bookings = await prisma.booking.findMany({
      where: {
        studentId: session.user.id,
      },
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
        createdAt: 'desc',
      },
    })
  } else if (session.user.role === 'TUTOR') {
    tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId: session.user.id },
    })

    bookings = await prisma.booking.findMany({
      where: {
        tutorId: tutorProfile?.id || '',
      },
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
        createdAt: 'desc',
      },
    })
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
            <p className="text-gray-600">View and manage all your bookings</p>
          </div>
          {session.user.role === 'PARENT' && (
            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-600 to-pink-700 text-white rounded-lg hover:from-pink-700 hover:to-pink-800 transition-all shadow-md hover:shadow-lg font-medium"
            >
              <Calendar className="h-5 w-5" />
              Book a Tutor
            </Link>
          )}
        </div>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <CreditCard className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No bookings found</h3>
            <p className="text-gray-600 mb-6">You don&apos;t have any bookings yet.</p>
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
                        </div>
                      </div>
                    </div>

                    {/* Right Section */}
                    <div className="flex flex-col items-end gap-3">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          ${booking.price.toFixed(2)}
                        </p>
                        {booking.payment ? (
                          <p
                            className={`text-xs mt-1 ${
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

