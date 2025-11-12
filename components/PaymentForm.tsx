'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, DollarSign, Clock, CreditCard, AlertCircle, CheckCircle } from 'lucide-react'

export default function PaymentForm({ booking }: any) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [initializing, setInitializing] = useState(true)
  const [paymentData, setPaymentData] = useState<{
    authorizationUrl: string
    accessCode: string
    reference: string
  } | null>(null)

  useEffect(() => {
    // Initialize payment on mount
    const initializePayment = async () => {
      try {
        setError('')
        setInitializing(true)
        
        console.log('Initializing payment for booking:', booking.id)
        if (booking.isRecurring) {
          console.log('Recurring booking details:', {
            isParent: !booking.parentBookingId,
            childBookings: booking.childBookings?.length || 0,
            price: booking.price,
          })
        }
        
        const response = await fetch('/api/payments/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId: booking.id }),
        })

        const data = await response.json()

        if (!response.ok) {
          console.error('Payment initialization failed:', data)
          setError(data.details || data.error || 'Failed to initialize payment')
          setInitializing(false)
          return
        }

        // Check what we received
        console.log('Payment initialization response:', {
          hasReference: !!data.reference,
          hasAccessCode: !!data.accessCode,
          hasAuthorizationUrl: !!data.authorizationUrl,
          fullData: data,
        })

        if (data.reference && data.accessCode && data.authorizationUrl) {
          console.log('✅ Payment initialized successfully')
          console.log('Authorization URL:', data.authorizationUrl)
          // Clear any previous errors
          setError('')
          setPaymentData({
            authorizationUrl: data.authorizationUrl,
            accessCode: data.accessCode,
            reference: data.reference,
          })
          setInitializing(false)
        } else if (data.reference && data.accessCode) {
          // If we have reference and accessCode but no URL, construct it
          console.warn('⚠️ Authorization URL missing, constructing from access code')
          const constructedUrl = `https://checkout.paystack.com/${data.accessCode}`
          console.log('Constructed URL:', constructedUrl)
          // Clear any previous errors
          setError('')
          setPaymentData({
            authorizationUrl: constructedUrl,
            accessCode: data.accessCode,
            reference: data.reference,
          })
          setInitializing(false)
        } else {
          console.error('❌ Invalid payment data received:', data)
          const errorMsg = data.error || data.details || 'Payment initialization incomplete. Please check server logs.'
          setError(errorMsg)
          setInitializing(false)
        }
      } catch (err) {
        console.error('Error initializing payment:', err)
        setError(`Failed to initialize payment: ${err instanceof Error ? err.message : 'Unknown error'}`)
        setInitializing(false)
      }
    }

    initializePayment()
  }, [booking.id])

  const handlePayment = () => {
    if (!paymentData?.authorizationUrl) {
      setError('Payment URL not available. Please refresh the page.')
      return
    }

    setLoading(true)
    setError('')

    const paymentUrl = paymentData.authorizationUrl
    console.log('🔄 Redirecting to Paystack:', paymentUrl)

    // Validate URL
    if (!paymentUrl.startsWith('http://') && !paymentUrl.startsWith('https://')) {
      console.error('Invalid payment URL:', paymentUrl)
      setError('Invalid payment URL. Please refresh and try again.')
      setLoading(false)
      return
    }

    // Try multiple methods to ensure redirect works
    try {
      // Method 1: Direct redirect (most reliable)
      console.log('Attempting redirect via window.location.href')
      window.location.href = paymentUrl
      
      // Fallback: If redirect doesn't happen within 1 second, try alternative method
      setTimeout(() => {
        if (document.hasFocus()) {
          console.log('Redirect may have been blocked, trying window.location.assign')
          window.location.assign(paymentUrl)
        }
      }, 1000)
    } catch (err) {
      console.error('Redirect error:', err)
      // Method 2: Fallback - assign location
      window.location.assign(paymentUrl)
    }
  }

  if (initializing) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading payment form...</p>
        {error && (
          <p className="mt-4 text-sm text-red-600">{error}</p>
        )}
      </div>
    )
  }

  if (!paymentData && !initializing) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <p className="text-red-700 font-medium">
              {error || 'Failed to initialize payment. Please try again.'}
            </p>
          </div>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-pink-600 text-white px-6 py-3 rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 font-semibold"
        >
          Refresh Page
        </button>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      {/* Booking Details Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900">
          <Calendar className="h-5 w-5 text-pink-600" />
          Booking Details
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Tutor:</span>
            <span className="font-medium text-gray-900">{booking.tutor.user.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Subject:</span>
            <span className="font-medium text-gray-900">{booking.subject}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Date:</span>
            <span className="font-medium text-gray-900">{formatDate(booking.scheduledAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Time:</span>
            <span className="font-medium text-gray-900">{formatTime(booking.scheduledAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Duration:</span>
            <span className="font-medium text-gray-900 flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {booking.duration} minutes
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Type:</span>
            <span className="font-medium text-gray-900">
              {booking.lessonType === 'ONLINE' ? 'Online' : 'In-Person'}
            </span>
          </div>
          {booking.isGroupClass && (
            <div className="flex justify-between">
              <span className="text-gray-600">Class Type:</span>
              <span className="font-medium text-pink-600">Group Class</span>
            </div>
          )}
          {booking.isRecurring && !booking.parentBookingId && booking.childBookings && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-600">Recurring:</span>
                <span className="font-medium text-pink-600">
                  {1 + booking.childBookings.length} lessons
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Per lesson:</span>
                <span className="text-gray-700">
                  ₵{booking.price.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </>
          )}
          <div className="border-t pt-3 mt-3">
            <div className="flex justify-between text-lg font-bold">
              <span className="flex items-center gap-2 text-gray-900">
                <DollarSign className="h-5 w-5 text-pink-600" />
                Total:
              </span>
              <span className="text-pink-600">
                ₵{(() => {
                  try {
                    // Calculate total for recurring bookings
                    if (booking.isRecurring && !booking.parentBookingId && booking.childBookings && Array.isArray(booking.childBookings)) {
                      const total = booking.price + booking.childBookings.reduce((sum: number, child: any) => sum + (child.price || 0), 0)
                      return total.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    }
                    return booking.price.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  } catch (err) {
                    console.error('Error calculating total:', err)
                    return booking.price.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  }
                })()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900">
          <CreditCard className="h-5 w-5 text-pink-600" />
          Payment Information
        </h3>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900 mb-1">
                Secure Payment Processing
              </p>
              <p className="text-xs text-blue-700">
                Your payment will be processed securely through Paystack. You can pay with your card, bank account, or mobile money.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            console.log('Pay button clicked', { paymentData, hasUrl: !!paymentData?.authorizationUrl })
            handlePayment()
          }}
          disabled={loading || !paymentData || !paymentData?.authorizationUrl}
          className="w-full bg-gradient-to-r from-pink-600 to-pink-700 text-white px-6 py-4 rounded-lg hover:from-pink-700 hover:to-pink-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Redirecting...
            </>
          ) : !paymentData?.authorizationUrl ? (
            <>
              <AlertCircle className="h-5 w-5" />
              Payment Not Ready
            </>
          ) : (
            <>
              <CreditCard className="h-5 w-5" />
              Pay ₵{(() => {
                try {
                  // Calculate total for recurring bookings
                  if (booking.isRecurring && !booking.parentBookingId && booking.childBookings && Array.isArray(booking.childBookings)) {
                    const total = booking.price + booking.childBookings.reduce((sum: number, child: any) => sum + (child.price || 0), 0)
                    return total.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  }
                  return booking.price.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                } catch (err) {
                  console.error('Error calculating payment total:', err)
                  return booking.price.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                }
              })()}
            </>
          )}
        </button>

        <p className="text-xs text-gray-500 text-center mt-4">
          By clicking &quot;Pay&quot;, you will be redirected to Paystack&apos;s secure payment page
        </p>

        {paymentData?.authorizationUrl && (
          <div className="mt-4 pt-4 border-t space-y-3">
            <div className="flex flex-col gap-2">
              <a
                href={paymentData.authorizationUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.preventDefault()
                  if (paymentData?.authorizationUrl) {
                    window.open(paymentData.authorizationUrl, '_blank', 'noopener,noreferrer')
                  }
                }}
                className="block w-full text-center text-sm text-pink-600 hover:text-pink-700 underline font-medium"
              >
                Or open payment page in a new tab
              </a>
              <button
                type="button"
                onClick={() => {
                  if (paymentData?.authorizationUrl) {
                    window.open(paymentData.authorizationUrl, '_blank')
                  }
                }}
                className="text-xs text-gray-600 hover:text-gray-800 underline"
              >
                Click here if redirect doesn&apos;t work
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-2 p-3 bg-gray-100 rounded text-xs break-all">
                <p className="font-semibold mb-1">Debug Info:</p>
                <p><strong>URL:</strong> {paymentData.authorizationUrl}</p>
                <p><strong>Reference:</strong> {paymentData.reference}</p>
                <p><strong>Access Code:</strong> {paymentData.accessCode}</p>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(paymentData.authorizationUrl)
                    alert('URL copied to clipboard!')
                  }}
                  className="mt-2 px-2 py-1 bg-gray-200 rounded text-xs"
                >
                  Copy URL
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
