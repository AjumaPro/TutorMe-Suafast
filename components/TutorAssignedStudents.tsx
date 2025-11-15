'use client'

import { useState } from 'react'
import Link from 'next/link'
import { User, BookOpen, Calendar, Mail, Phone, MapPin, Video, Clock, CheckCircle, XCircle } from 'lucide-react'
import { formatCurrency, parseCurrencyCode } from '@/lib/currency'

interface Student {
  id: string
  name: string
  email: string
  phone?: string
  image?: string
}

interface Course {
  id: string
  subject: string
  scheduledAt: string
  duration: number
  lessonType: string
  status: string
  price: number
  currency: string
  student: Student
  addressId?: string
  studentAddress?: {
    street: string
    city: string
    state: string
    zipCode: string
  }
}

interface TutorAssignedStudentsProps {
  bookings: Course[]
}

export default function TutorAssignedStudents({ bookings }: TutorAssignedStudentsProps) {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed' | 'pending'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Get unique students
  const uniqueStudents = Array.from(
    new Map(bookings.map((b) => [b.student.id, b.student])).values()
  )

  // Filter bookings
  const filteredBookings = bookings.filter((booking) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'upcoming' && (booking.status === 'CONFIRMED' || booking.status === 'PENDING')) ||
      (filter === 'completed' && booking.status === 'COMPLETED') ||
      (filter === 'pending' && booking.status === 'PENDING')

    const matchesSearch =
      booking.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.subject.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesFilter && matchesSearch
  })

  // Group bookings by student
  const bookingsByStudent = filteredBookings.reduce((acc, booking) => {
    if (!acc[booking.student.id]) {
      acc[booking.student.id] = {
        student: booking.student,
        bookings: [],
      }
    }
    acc[booking.student.id].bookings.push(booking)
    return acc
  }, {} as Record<string, { student: Student; bookings: Course[] }>)

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
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Users className="h-5 w-5 text-pink-600" />
            My Students & Courses
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {uniqueStudents.length} student{uniqueStudents.length !== 1 ? 's' : ''} • {bookings.length} course{bookings.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by student name, email, or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'upcoming', 'pending', 'completed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                  filter === f
                    ? 'bg-pink-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Students List */}
      {Object.keys(bookingsByStudent).length === 0 ? (
        <div className="text-center py-12">
          <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">No students found</p>
          <p className="text-gray-400 text-sm">
            {filter === 'all'
              ? 'You don\'t have any assigned students yet'
              : `No ${filter} courses at the moment`}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.values(bookingsByStudent).map(({ student, bookings: studentBookings }) => (
            <div
              key={student.id}
              className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              {/* Student Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 text-lg">{student.name}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {student.email}
                      </div>
                      {student.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {student.phone}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total Courses</p>
                  <p className="text-2xl font-bold text-gray-900">{studentBookings.length}</p>
                </div>
              </div>

              {/* Student Courses */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700 mb-2">Courses:</h4>
                {studentBookings.map((booking) => {
                  const scheduled = new Date(booking.scheduledAt)
                  return (
                    <div
                      key={booking.id}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-100"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <BookOpen className="h-4 w-4 text-pink-600" />
                            <h5 className="font-semibold text-gray-800">{booking.subject}</h5>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(
                                booking.status
                              )}`}
                            >
                              {getStatusIcon(booking.status)}
                              {booking.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span>
                                {scheduled.toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span>
                                {scheduled.toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                                {' - '}
                                {booking.duration} min
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              {booking.lessonType === 'ONLINE' ? (
                                <Video className="h-4 w-4 text-blue-400" />
                              ) : (
                                <MapPin className="h-4 w-4 text-green-400" />
                              )}
                              <span>{booking.lessonType === 'ONLINE' ? 'Online' : 'In-Person'}</span>
                            </div>
                            <div className="text-gray-700 font-semibold">
                              {formatCurrency(booking.price, parseCurrencyCode(booking.currency))}
                            </div>
                          </div>
                          {booking.lessonType === 'IN_PERSON' && booking.studentAddress && (
                            <div className="mt-2 text-sm text-gray-600 flex items-start gap-1">
                              <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                              <span>
                                {booking.studentAddress.street}, {booking.studentAddress.city},{' '}
                                {booking.studentAddress.state} {booking.studentAddress.zipCode}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <Link
                            href={`/lessons/${booking.id}`}
                            className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors text-sm font-medium inline-block"
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
          ))}
        </div>
      )}
    </div>
  )
}

