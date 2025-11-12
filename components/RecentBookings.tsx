'use client'

import { Calendar, Clock, MapPin, Video, User, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface Booking {
  id: string
  subject: string
  scheduledAt: Date
  duration: number
  lessonType: 'ONLINE' | 'IN_PERSON'
  status: string
  tutorName?: string
  studentName?: string
  isRecurring?: boolean
}

interface RecentBookingsProps {
  bookings: Booking[]
  userRole: string
}

export default function RecentBookings({ bookings, userRole }: RecentBookingsProps) {
  const recentBookings = bookings.slice(0, 5)

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-pink-600" />
          Recent Bookings
        </h3>
        <Link href="/bookings" className="text-sm text-pink-600 hover:text-pink-700 font-medium">
          View All
        </Link>
      </div>

      <div className="space-y-3">
        {recentBookings.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent bookings</p>
            <Link
              href="/search"
              className="text-pink-600 hover:text-pink-700 text-sm font-medium mt-2 inline-block"
            >
              Book a lesson
            </Link>
          </div>
        ) : (
          recentBookings.map((booking) => (
            <Link
              key={booking.id}
              href={`/bookings/${booking.id}`}
              className="block p-4 border border-gray-200 rounded-lg hover:border-pink-300 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-gray-900 group-hover:text-pink-600">
                      {booking.subject}
                    </h4>
                    {booking.isRecurring && (
                      <span className="text-xs bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded">
                        Recurring
                      </span>
                    )}
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${
                        booking.status === 'CONFIRMED'
                          ? 'bg-green-100 text-green-700'
                          : booking.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-700'
                          : booking.status === 'COMPLETED'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(booking.scheduledAt), 'MMM d, yyyy')}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(booking.scheduledAt), 'h:mm a')}
                    </div>
                    <div className="flex items-center gap-1">
                      {booking.lessonType === 'ONLINE' ? (
                        <Video className="h-3 w-3" />
                      ) : (
                        <MapPin className="h-3 w-3" />
                      )}
                      {booking.lessonType}
                    </div>
                  </div>

                  {userRole === 'PARENT' && booking.tutorName && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-600">
                      <User className="h-3 w-3" />
                      {booking.tutorName}
                    </div>
                  )}

                  {userRole === 'TUTOR' && booking.studentName && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-600">
                      <User className="h-3 w-3" />
                      {booking.studentName}
                    </div>
                  )}
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-pink-600 transition-colors flex-shrink-0" />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}

