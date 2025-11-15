'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatCurrency, parseCurrencyCode } from '@/lib/currency'
import { Calendar, Clock, Video, MapPin, User, CheckCircle, XCircle, Play, MoreVertical, Check, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Booking {
  id: string
  subject: string
  scheduledAt: string
  duration: number
  lessonType: string
  status: string
  price: number
  currency: string
  student?: {
    name: string
    email: string
    image?: string
  }
  videoSession?: {
    sessionToken: string
    status: string
  } | null
}

interface TutorClassManagementProps {
  bookings: Booking[]
  tutorProfile: any
}

export default function TutorClassManagement({ bookings, tutorProfile }: TutorClassManagementProps) {
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'today' | 'pending' | 'completed'>('all')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [processingBooking, setProcessingBooking] = useState<string | null>(null)

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const filteredBookings = bookings.filter((booking) => {
    const scheduled = new Date(booking.scheduledAt)
    
    switch (filter) {
      case 'upcoming':
        return scheduled >= now && (booking.status === 'CONFIRMED' || booking.status === 'PENDING')
      case 'today':
        return scheduled >= today && scheduled < tomorrow && (booking.status === 'CONFIRMED' || booking.status === 'PENDING')
      case 'pending':
        return booking.status === 'PENDING'
      case 'completed':
        return booking.status === 'COMPLETED'
      default:
        return true
    }
  })

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

  const canStartSession = (booking: Booking) => {
    if (booking.lessonType !== 'ONLINE') return false
    if (booking.status !== 'CONFIRMED' && booking.status !== 'COMPLETED') return false
    
    const scheduled = new Date(booking.scheduledAt)
    const durationMinutes = booking.duration
    const endTime = new Date(scheduled.getTime() + durationMinutes * 60 * 1000)
    
    // Can start if within 15 minutes before or during the lesson
    const canStart = now >= new Date(scheduled.getTime() - 15 * 60 * 1000) && now <= endTime
    return canStart
  }

  const handleStartSession = async (booking: Booking) => {
    try {
      // Navigate to lesson page which will handle session creation
      router.push(`/lessons/${booking.id}`)
    } catch (error) {
      console.error('Error starting session:', error)
      alert('Failed to start session')
    }
  }

  const handleAcceptReject = async (bookingId: string, accepted: boolean) => {
    if (processingBooking) return
    
    setProcessingBooking(bookingId)
    try {
      const response = await fetch(`/api/bookings/${bookingId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accepted }),
      })

      const result = await response.json()

      if (!response.ok) {
        alert(result.error || `Failed to ${accepted ? 'accept' : 'reject'} booking`)
        return
      }

      // Refresh the page to show updated status
      router.refresh()
    } catch (error) {
      console.error('Error accepting/rejecting booking:', error)
      alert(`Failed to ${accepted ? 'accept' : 'reject'} booking`)
    } finally {
      setProcessingBooking(null)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-pink-600" />
          My Classes
        </h2>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="all">All Classes</option>
            <option value="upcoming">Upcoming</option>
            <option value="today">Today</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">No classes found</p>
          <p className="text-gray-400 text-sm">
            {filter === 'all'
              ? 'You don\'t have any classes yet'
              : `No ${filter} classes at the moment`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const scheduled = new Date(booking.scheduledAt)
            const canStart = canStartSession(booking)
            
            return (
              <div
                key={booking.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-800 text-lg">
                            {booking.student?.name || 'Student'}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(
                              booking.status
                            )}`}
                          >
                            {getStatusIcon(booking.status)}
                            {booking.status}
                          </span>
                        </div>
                        <p className="text-gray-600 font-medium">{booking.subject}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>
                          {scheduled.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
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
                      <div className="flex items-center gap-2 text-gray-600">
                        {booking.lessonType === 'ONLINE' ? (
                          <Video className="h-4 w-4 text-blue-400" />
                        ) : (
                          <MapPin className="h-4 w-4 text-green-400" />
                        )}
                        <span>{booking.lessonType === 'ONLINE' ? 'Online' : 'In-Person'}</span>
                      </div>
                      <div className="text-gray-600">
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(booking.price, parseCurrencyCode(booking.currency))}
                        </span>
                      </div>
                    </div>

                    {booking.student?.email && (
                      <div className="mt-3 text-sm text-gray-500">
                        <User className="h-4 w-4 inline mr-1" />
                        {booking.student.email}
                      </div>
                    )}
                  </div>

                  <div className="ml-4 flex flex-col gap-2">
                    {booking.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleAcceptReject(booking.id, true)}
                          disabled={processingBooking === booking.id}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Check className="h-4 w-4" />
                          {processingBooking === booking.id ? 'Processing...' : 'Accept'}
                        </button>
                        <button
                          onClick={() => handleAcceptReject(booking.id, false)}
                          disabled={processingBooking === booking.id}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <X className="h-4 w-4" />
                          {processingBooking === booking.id ? 'Processing...' : 'Reject'}
                        </button>
                      </>
                    )}
                    {canStart && booking.lessonType === 'ONLINE' && booking.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleStartSession(booking)}
                        className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors text-sm font-medium flex items-center gap-2 whitespace-nowrap"
                      >
                        <Play className="h-4 w-4" />
                        Start Class
                      </button>
                    )}
                    <Link
                      href={`/lessons/${booking.id}`}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-center"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

