'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { CheckCircle, XCircle, Loader2, Calendar, Clock, User, DollarSign, Phone, MapPin } from 'lucide-react'
import { formatCurrency, parseCurrencyCode } from '@/lib/currency'

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const searchParams = useSearchParams()
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')
  const [bookingId, setBookingId] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const resolvedParams = await params
        const id = resolvedParams.id
        setBookingId(id)
        
        const paymentSuccess = searchParams.get('payment') === 'success'
        const reference = searchParams.get('reference') || searchParams.get('trxref')

        // If payment=success, verify the payment
        if (paymentSuccess) {
          setVerifying(true)
          try {
            // If we have a reference, use it. Otherwise, fetch payment record to get reference
            let paymentReference = reference
            
            if (!paymentReference) {
              // Fetch payment record to get the reference
              const paymentResponse = await fetch(`/api/bookings?id=${id}`)
              if (paymentResponse.ok) {
                const bookingData = await paymentResponse.json()
                const booking = bookingData.booking || bookingData
                if (booking?.payment?.paystackReference) {
                  paymentReference = booking.payment.paystackReference
                }
              }
            }

            if (paymentReference) {
              const verifyResponse = await fetch('/api/payments/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  reference: paymentReference,
                  bookingId: id,
                }),
              })

              const verifyResult = await verifyResponse.json()

              if (!verifyResponse.ok) {
                console.error('Payment verification failed:', verifyResult)
                setError(verifyResult.error || 'Payment verification failed')
              } else {
                console.log('Payment verified successfully:', verifyResult)
                // Reload booking after verification
                setTimeout(() => {
                  loadBooking(id)
                }, 1000)
              }
            } else {
              console.warn('No payment reference found, payment may have been processed via webhook')
              // Still reload booking in case webhook processed it
              setTimeout(() => {
                loadBooking(id)
              }, 2000)
            }
          } catch (verifyError) {
            console.error('Error verifying payment:', verifyError)
            setError('Failed to verify payment. Please check your bookings.')
          } finally {
            setVerifying(false)
          }
        }

        // Fetch booking details
        await loadBooking(id)
      } catch (err) {
        console.error('Error loading booking:', err)
        setError('Failed to load booking details')
        setLoading(false)
      }
    }

    const loadBooking = async (id: string) => {
      try {
        const response = await fetch(`/api/bookings?id=${id}`)
        if (!response.ok) {
          throw new Error('Failed to load booking')
        }

        const data = await response.json()
        setBooking(data.booking || data)
        setLoading(false)
      } catch (err) {
        console.error('Error loading booking:', err)
        setError('Failed to load booking details')
        setLoading(false)
      }
    }

    loadData()
  }, [params, searchParams])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-pink-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading booking details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Not Found</h1>
            <p className="text-gray-600 mb-6">{error || 'The booking you\'re looking for doesn\'t exist.'}</p>
            <Link
              href="/bookings"
              className="inline-block px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
            >
              Go to Bookings
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const paymentSuccess = searchParams.get('payment') === 'success'
  const currency = parseCurrencyCode(booking.currency)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {paymentSuccess && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded">
            <div className="flex items-center gap-2">
              {verifying ? (
                <>
                  <Loader2 className="h-5 w-5 text-green-600 animate-spin" />
                  <p className="text-green-700 font-medium">Verifying payment...</p>
                </>
              ) : error ? (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  <p className="text-red-700 font-medium">{error}</p>
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <p className="text-green-700 font-medium">Payment successful! Your booking has been confirmed.</p>
                </>
              )}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Booking Details</h1>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                booking.status === 'CONFIRMED'
                  ? 'bg-green-100 text-green-800'
                  : booking.status === 'PENDING'
                  ? 'bg-yellow-100 text-yellow-800'
                  : booking.status === 'COMPLETED'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {booking.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-5 w-5" />
                <span className="font-medium">Date:</span>
                <span>{new Date(booking.scheduledAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-5 w-5" />
                <span className="font-medium">Time:</span>
                <span>{new Date(booking.scheduledAt).toLocaleTimeString()}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <User className="h-5 w-5" />
                <span className="font-medium">Subject:</span>
                <span>{booking.subject}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <DollarSign className="h-5 w-5" />
                <span className="font-medium">Amount:</span>
                <span>{formatCurrency(booking.price, currency)}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-gray-600 font-medium">Tutor:</span>
                <p className="text-gray-900">{booking.tutor?.user?.name || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-600 font-medium">Student:</span>
                <p className="text-gray-900">{booking.student?.name || 'N/A'}</p>
                {booking.student?.phone && (
                  <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    <a 
                      href={`tel:${booking.student.phone}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {booking.student.phone}
                    </a>
                  </p>
                )}
                {booking.lessonType === 'IN_PERSON' && booking.studentAddress && (
                  <p className="text-sm text-gray-600 mt-1 flex items-start gap-1">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>
                      {booking.studentAddress.street}, {booking.studentAddress.city}, {booking.studentAddress.state} {booking.studentAddress.zipCode}
                    </span>
                  </p>
                )}
              </div>
              <div>
                <span className="text-gray-600 font-medium">Lesson Type:</span>
                <p className="text-gray-900">{booking.lessonType === 'ONLINE' ? 'Online' : 'In-Person'}</p>
              </div>
              <div>
                <span className="text-gray-600 font-medium">Duration:</span>
                <p className="text-gray-900">{booking.duration} minutes</p>
              </div>
              <div>
                <span className="text-gray-600 font-medium">Payment Status:</span>
                <p
                  className={`font-medium ${
                    booking.payment?.status === 'PAID' ? 'text-green-600' : 'text-yellow-600'
                  }`}
                >
                  {booking.payment?.status || 'PENDING'}
                </p>
              </div>
            </div>
          </div>

          {booking.notes && (
            <div className="mt-6 pt-6 border-t">
              <span className="text-gray-600 font-medium">Notes:</span>
              <p className="text-gray-900 mt-2">{booking.notes}</p>
            </div>
          )}

          <div className="mt-6 flex gap-4">
            <Link
              href="/bookings"
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Back to Bookings
            </Link>
            {booking.status === 'CONFIRMED' && booking.lessonType === 'ONLINE' && (
              <Link
                href={`/lessons/${booking.id}`}
                className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
              >
                Join Lesson
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

