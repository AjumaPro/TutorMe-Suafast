'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Calendar, Clock, MapPin, Video, DollarSign, Plus, Repeat, User, Star, CheckCircle, AlertCircle, Users } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

const bookingSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  lessonType: z.enum(['IN_PERSON', 'ONLINE']),
  duration: z.number().min(30).max(180),
  addressId: z.string().optional(),
  notes: z.string().optional(),
})

type BookingFormData = z.infer<typeof bookingSchema>

export default function BookingForm({ tutor, studentAddresses: initialAddresses, showRecurringOption = true }: any) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [addresses, setAddresses] = useState(initialAddresses || [])
  const [showAddAddress, setShowAddAddress] = useState(false)
  const [addingAddress, setAddingAddress] = useState(false)
  const [availabilitySlots, setAvailabilitySlots] = useState<any[]>([])
  const [existingBookings, setExistingBookings] = useState<any[]>([])
  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  const [loadingAvailability, setLoadingAvailability] = useState(false)
  const [isGroupClass, setIsGroupClass] = useState(false)
  const [availableGroupClasses, setAvailableGroupClasses] = useState<any[]>([])
  const [loadingGroupClasses, setLoadingGroupClasses] = useState(false)
  const [selectedGroupClassToJoin, setSelectedGroupClassToJoin] = useState<string | null>(null)
  const [newAddress, setNewAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
    isDefault: false,
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      lessonType: 'ONLINE',
      duration: 60,
    },
  })

  const lessonType = watch('lessonType')
  const duration = watch('duration') || 60
  const subject = watch('subject')
  const price = ((tutor.hourlyRate * duration) / 60).toFixed(2)

  // Fetch addresses on mount and when needed
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const response = await fetch('/api/addresses')
        if (response.ok) {
          const data = await response.json()
          setAddresses(data.addresses || [])
        }
      } catch (err) {
        console.error('Failed to fetch addresses:', err)
      }
    }
    fetchAddresses()
  }, [])

  // Fetch tutor availability and existing bookings
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!tutor?.id) {
        return
      }
      
      setLoadingAvailability(true)
      setError('')
      try {
        // Fetch availability slots
        const availabilityResponse = await fetch(`/api/availability?tutorId=${tutor.id}`)
        if (availabilityResponse.ok) {
          const availabilityData = await availabilityResponse.json()
          setAvailabilitySlots(availabilityData.slots || [])
        } else {
          const errorData = await availabilityResponse.json().catch(() => ({}))
          setError(`Failed to load availability: ${errorData.error || 'Unknown error'}`)
        }

        // Fetch existing bookings to check conflicts
        const bookingsResponse = await fetch(`/api/bookings?tutorId=${tutor.id}`)
        if (bookingsResponse.ok) {
          const bookingsData = await bookingsResponse.json()
          setExistingBookings(bookingsData.bookings || [])
        }
      } catch (err) {
        setError('Failed to load tutor availability. Please try refreshing the page.')
      } finally {
        setLoadingAvailability(false)
      }
    }
    fetchAvailability()
  }, [tutor?.id])

  // Calculate available times when date is selected
  useEffect(() => {
    if (!selectedDate) {
      setAvailableTimes([])
      return
    }

    if (availabilitySlots.length === 0) {
      setAvailableTimes([])
      return
    }

    // Parse the selected date and get the day of week
    // Split the date string to avoid timezone issues
    const [year, month, day] = selectedDate.split('-').map(Number)
    const selectedDateObj = new Date(year, month - 1, day) // month is 0-indexed
    const selectedDay = selectedDateObj.getDay() // 0 = Sunday, 1 = Monday, etc.
    
    // Find availability slot for this day
    const daySlot = availabilitySlots.find((slot) => {
      return slot.dayOfWeek === selectedDay && slot.isAvailable === true
    })
    
    if (!daySlot) {
      setAvailableTimes([])
      return
    }

    // Generate time slots based on availability (30-minute intervals)
    const times: string[] = []
    const [startHour, startMin] = daySlot.startTime.split(':').map(Number)
    const [endHour, endMin] = daySlot.endTime.split(':').map(Number)
    
    // Calculate the end time considering the selected duration
    const dayEndTime = new Date(`${selectedDate}T${daySlot.endTime}`)
    
    let currentHour = startHour
    let currentMin = startMin
    
    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      const timeString = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`
      
      // Create a full datetime for this slot
      const slotDateTime = new Date(`${selectedDate}T${timeString}`)
      
      // Check if the selected duration fits within the tutor's availability
      const slotEndTime = new Date(slotDateTime.getTime() + duration * 60000)
      const durationFits = slotEndTime <= dayEndTime
      
      // Check if this time conflicts with existing bookings
      const conflicts = existingBookings.some((booking) => {
        const bookingDate = new Date(booking.scheduledAt)
        const bookingEnd = new Date(bookingDate.getTime() + booking.duration * 60000)
        
        // Check if the slot overlaps with the booking
        // A slot conflicts if it starts during a booking or if a booking starts during this slot
        return (
          booking.status !== 'CANCELLED' &&
          bookingDate.toDateString() === slotDateTime.toDateString() &&
          (
            (slotDateTime >= bookingDate && slotDateTime < bookingEnd) ||
            (slotEndTime > bookingDate && slotEndTime <= bookingEnd) ||
            (slotDateTime <= bookingDate && slotEndTime >= bookingEnd)
          )
        )
      })
      
      // Also check if the slot is in the past
      const isPast = slotDateTime <= new Date()
      
      if (!conflicts && !isPast && durationFits) {
        times.push(timeString)
      }
      
      // Increment by 30 minutes
      currentMin += 30
      if (currentMin >= 60) {
        currentMin = 0
        currentHour++
      }
    }
    
    setAvailableTimes(times)
  }, [selectedDate, availabilitySlots, existingBookings, duration])

  // Fetch available group classes when subject, date, and time are selected
  useEffect(() => {
    const fetchGroupClasses = async () => {
      if (!isGroupClass || !tutor?.id || !subject || !selectedDate || !selectedTime) {
        setAvailableGroupClasses([])
        return
      }

      setLoadingGroupClasses(true)
      try {
        const scheduledAt = new Date(`${selectedDate}T${selectedTime}`)
        const response = await fetch(
          `/api/bookings/group?tutorId=${tutor.id}&subject=${encodeURIComponent(subject)}&scheduledAt=${scheduledAt.toISOString()}`
        )
        if (response.ok) {
          const data = await response.json()
          setAvailableGroupClasses(data.groupClasses || [])
        }
      } catch (err) {
        console.error('Failed to fetch group classes:', err)
      } finally {
        setLoadingGroupClasses(false)
      }
    }

    fetchGroupClasses()
  }, [isGroupClass, tutor?.id, subject, selectedDate, selectedTime])

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddingAddress(true)
    setError('')

    try {
      const response = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAddress),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to add address')
        setAddingAddress(false)
        return
      }

      // Add the new address to the list
      setAddresses([...addresses, result.address])
      setShowAddAddress(false)
      setNewAddress({
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'USA',
        isDefault: false,
      })
      
      // Set the newly added address as selected
      setValue('addressId', result.address.id)
    } catch (err) {
      setError('An error occurred while adding the address')
    } finally {
      setAddingAddress(false)
    }
  }

  const handleDateChange = (date: string) => {
    setSelectedDate(date)
    setSelectedTime('') // Reset time when date changes
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }

  const onSubmit = async (data: BookingFormData) => {
    setLoading(true)
    setError('')

    // Validate date and time selection
    if (!selectedDate || !selectedTime) {
      setError('Please select both date and time')
      setLoading(false)
      return
    }

    // Validate subject selection
    if (!data.subject || data.subject.trim() === '') {
      setError('Please select a subject')
      setLoading(false)
      return
    }

    const scheduledAt = new Date(`${selectedDate}T${selectedTime}`)

    if (scheduledAt <= new Date()) {
      setError('Please select a future date and time')
      setLoading(false)
      return
    }

    if (data.lessonType === 'IN_PERSON' && !data.addressId) {
      setError('Please select an address for in-person lessons')
      setLoading(false)
      return
    }

    // If joining an existing group class
    if (isGroupClass && selectedGroupClassToJoin) {
      try {
        const response = await fetch('/api/bookings/group', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            groupClassId: selectedGroupClassToJoin,
          }),
        })

        if (!response.ok) {
          const result = await response.json()
          setError(result.error || 'Failed to join group class')
          setLoading(false)
          return
        }

        const result = await response.json()

        // Redirect to payment page
        if (result.booking && result.booking.id) {
          window.location.href = `/bookings/${result.booking.id}/payment`
        } else {
          setError('Joined group class but ID not returned. Please check your bookings.')
          setLoading(false)
        }
        return
      } catch (err) {
        console.error('Group class join error:', err)
        setError(`An error occurred: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`)
        setLoading(false)
        return
      }
    }

    try {
      const bookingPayload: any = {
        tutorId: tutor.id,
        subject: data.subject,
        lessonType: data.lessonType,
        scheduledAt: scheduledAt.toISOString(),
        duration: data.duration,
        price: parseFloat(price),
        isGroupClass: isGroupClass || false,
        maxParticipants: 10,
      }

      // Add optional fields only if they exist
      if (data.addressId) {
        bookingPayload.addressId = data.addressId
      }
      if (data.notes && data.notes.trim()) {
        bookingPayload.notes = data.notes.trim()
      }

      console.log('Creating booking with payload:', bookingPayload)

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload),
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('Booking creation failed:', result)
        setError(result.details || result.error || 'Failed to create booking. Please try again.')
        setLoading(false)
        return
      }

      // Redirect immediately to payment page
      if (result.booking && result.booking.id) {
        // Use window.location for more reliable redirect
        window.location.href = `/bookings/${result.booking.id}/payment`
      } else {
        console.error('Booking response missing ID:', result)
        setError('Booking created but ID not returned. Please check your bookings.')
        setLoading(false)
      }
    } catch (err) {
      console.error('Booking creation error:', err)
      setError(`An error occurred: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`)
      setLoading(false)
    }
  }

  // Parse tutor subjects and grades
  const tutorSubjects = Array.isArray(tutor.subjects)
    ? tutor.subjects
    : JSON.parse(tutor.subjects || '[]')
  const tutorGrades = Array.isArray(tutor.grades)
    ? tutor.grades
    : JSON.parse(tutor.grades || '[]')

  return (
    <div className="space-y-6">
      {/* Tutor Info Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-start gap-4">
          {tutor.user?.image ? (
            <div className="relative w-20 h-20 rounded-full overflow-hidden flex-shrink-0">
              <Image
                src={tutor.user.image}
                alt={tutor.user.name}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              {tutor.user?.name?.charAt(0).toUpperCase() || 'T'}
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">{tutor.user?.name}</h2>
              {tutor.isVerified && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  <CheckCircle className="h-3 w-3" />
                  Verified
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                <span className="font-semibold">{tutor.rating?.toFixed(1) || '0.0'}</span>
                <span>({tutor.totalReviews || 0} reviews)</span>
              </div>
              {tutor.experience && (
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{tutor.experience} years experience</span>
                </div>
              )}
            </div>
            {tutor.bio && (
              <p className="text-gray-700 mb-3">{tutor.bio}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {tutorSubjects.slice(0, 5).map((subject: string) => (
                <span
                  key={subject}
                  className="px-2 py-1 bg-pink-100 text-pink-700 text-xs rounded-full font-medium"
                >
                  {subject}
                </span>
              ))}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-pink-600">
              ${tutor.hourlyRate}
            </div>
            <div className="text-sm text-gray-500">per hour</div>
          </div>
        </div>
      </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <p className="text-red-700 font-medium">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <p className="text-green-700 font-medium">{success}</p>
                </div>
              </div>
            )}

              {showRecurringOption && (
                <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Repeat className="h-5 w-5 text-pink-600" />
                      <div>
                        <h4 className="font-semibold text-pink-900">Want to book multiple lessons?</h4>
                        <p className="text-sm text-pink-700">Save time with recurring bookings</p>
                      </div>
                    </div>
                    <Link
                      href={`/tutor/${tutor.id}/book-recurring`}
                      className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors text-sm font-medium whitespace-nowrap"
                    >
                      Book Recurring
                    </Link>
                  </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isGroupClass}
                onChange={(e) => {
                  setIsGroupClass(e.target.checked)
                  setSelectedGroupClassToJoin(null)
                  setAvailableGroupClasses([])
                }}
                className="w-5 h-5 text-pink-600 rounded focus:ring-pink-500"
              />
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-semibold text-blue-900">Group Class</div>
                  <div className="text-sm text-blue-700">Join or create a group class (max 10 participants)</div>
                </div>
              </div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject *
            </label>
            <select
              {...register('subject')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            >
              <option value="">Select a subject</option>
              {tutorSubjects.map((subject: string) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
            {errors.subject && (
              <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lesson Type *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                lessonType === 'ONLINE'
                  ? 'border-pink-500 bg-pink-50'
                  : 'border-gray-200 hover:border-pink-300'
              }`}>
                <input
                  type="radio"
                  {...register('lessonType')}
                  value="ONLINE"
                  className="mr-3"
                />
                <div className="flex items-center gap-2">
                  <Video className={`h-6 w-6 ${lessonType === 'ONLINE' ? 'text-pink-600' : 'text-gray-400'}`} />
                <div>
                  <div className="font-medium">Online</div>
                    <div className="text-xs text-gray-500">Video call</div>
                  </div>
                </div>
              </label>
              <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                lessonType === 'IN_PERSON'
                  ? 'border-pink-500 bg-pink-50'
                  : 'border-gray-200 hover:border-pink-300'
              }`}>
                <input
                  type="radio"
                  {...register('lessonType')}
                  value="IN_PERSON"
                  className="mr-3"
                />
                <div className="flex items-center gap-2">
                  <MapPin className={`h-6 w-6 ${lessonType === 'IN_PERSON' ? 'text-pink-600' : 'text-gray-400'}`} />
                <div>
                  <div className="font-medium">In-Person</div>
                    <div className="text-xs text-gray-500">At your location</div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {lessonType === 'IN_PERSON' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                Address *
              </label>
                <button
                  type="button"
                  onClick={() => setShowAddAddress(!showAddAddress)}
                  className="text-sm text-pink-600 hover:text-pink-700 flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  {showAddAddress ? 'Cancel' : 'Add New Address'}
                </button>
              </div>

              {showAddAddress && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <form onSubmit={handleAddAddress} className="space-y-3">
                    <div>
                      <input
                        type="text"
                        placeholder="Street Address"
                        value={newAddress.street}
                        onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="City"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                      />
                      <input
                        type="text"
                        placeholder="State"
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Zip Code"
                        value={newAddress.zipCode}
                        onChange={(e) => setNewAddress({ ...newAddress, zipCode: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                      />
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={newAddress.isDefault}
                          onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                          className="rounded"
                        />
                        Set as default
                      </label>
                    </div>
                    <button
                      type="submit"
                      disabled={addingAddress}
                      className="w-full px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 disabled:opacity-50 font-medium"
                    >
                      {addingAddress ? 'Adding...' : 'Add Address'}
                    </button>
                  </form>
                </div>
              )}

              {addresses.length === 0 && !showAddAddress ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                  <p className="text-yellow-800 text-sm">
                    No addresses saved. Please add an address to continue.
                  </p>
                </div>
              ) : (
                <select
                  {...register('addressId')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select an address</option>
                  {addresses.map((address: any) => (
                    <option key={address.id} value={address.id}>
                      {address.street}, {address.city}, {address.state} {address.zipCode}
                      {address.isDefault ? ' (Default)' : ''}
                    </option>
                  ))}
                </select>
              )}
              {errors.addressId && (
                <p className="mt-1 text-sm text-red-600">{errors.addressId.message}</p>
              )}
            </div>
          )}

          <div>
            <label htmlFor="booking-date" className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              Select Date *
            </label>
            <input
              id="booking-date"
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            />
            {selectedDate && (
              <p className="mt-1 text-sm text-gray-600">{formatDate(selectedDate)}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="inline h-4 w-4 mr-1" />
              Select Time *
            </label>
            {loadingAvailability ? (
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 text-center">
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  Loading available times...
                </div>
              </div>
            ) : !selectedDate ? (
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 text-center">
                Please select a date first to see available times
              </div>
            ) : availableTimes.length > 0 ? (
              <div>
                <p className="text-xs text-gray-500 mb-2">
                  Available time slots for {formatDate(selectedDate)} (30-minute intervals):
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-60 overflow-y-auto p-2 border border-gray-200 rounded-md bg-gray-50">
                  {availableTimes.map((time) => {
                    const isSelected = selectedTime === time
                    return (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setSelectedTime(time)}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                          isSelected
                            ? 'bg-pink-600 text-white shadow-md scale-105'
                            : 'bg-white text-gray-700 hover:bg-pink-50 hover:border-pink-300 border border-gray-300'
                        }`}
                      >
                        {time}
                      </button>
                    )
                  })}
                </div>
                {selectedTime && (
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-gray-700">
                        Selected time: <span className="font-semibold text-pink-600">{selectedTime}</span>
                      </span>
                    </div>
                    {(() => {
                      const slotStart = new Date(`${selectedDate}T${selectedTime}`)
                      const slotEnd = new Date(slotStart.getTime() + duration * 60000)
                      const endTimeStr = slotEnd.toTimeString().slice(0, 5)
                      return (
                        <p className="text-xs text-gray-500 ml-6">
                          Lesson will run from {selectedTime} to {endTimeStr} ({duration} minutes)
                        </p>
                      )
                    })()}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800 mb-1">
                      No available time slots for {formatDate(selectedDate)}
                    </p>
                    <p className="text-xs text-yellow-700">
                      The tutor may not be available on this day, or all slots are already booked. Please try selecting a different date.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {isGroupClass && subject && selectedDate && selectedTime && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="inline h-4 w-4 mr-1" />
                Available Group Classes
              </label>
              {loadingGroupClasses ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                    Loading available group classes...
                  </div>
                </div>
              ) : availableGroupClasses.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto p-2 border border-gray-200 rounded-md bg-gray-50">
                  {availableGroupClasses.map((groupClass) => {
                    const isSelected = selectedGroupClassToJoin === groupClass.id
                    const scheduledAt = new Date(groupClass.scheduledAt)
                    const timeStr = scheduledAt.toTimeString().slice(0, 5)
                    return (
                      <button
                        key={groupClass.id}
                        type="button"
                        onClick={() => setSelectedGroupClassToJoin(groupClass.id)}
                        className={`w-full text-left p-3 rounded-md border-2 transition-all ${
                          isSelected
                            ? 'border-pink-500 bg-pink-50'
                            : 'border-gray-200 bg-white hover:border-pink-300 hover:bg-pink-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{groupClass.subject}</div>
                            <div className="text-sm text-gray-600">
                              {formatDate(scheduledAt.toISOString().split('T')[0])} at {timeStr}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {groupClass.currentParticipants} / {groupClass.maxParticipants} participants
                            </div>
                          </div>
                          <div className="ml-4">
                            {isSelected && (
                              <CheckCircle className="h-5 w-5 text-pink-600" />
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800 mb-1">
                        No available group classes found
                      </p>
                      <p className="text-xs text-blue-700">
                        You can create a new group class by continuing with your booking. Other parents and students can join your group class.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {selectedGroupClassToJoin && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center gap-2 text-sm text-green-800">
                    <CheckCircle className="h-4 w-4" />
                    <span>You will join the selected group class</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration (minutes) *
            </label>
            <select
              {...register('duration', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value={30}>30 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
              <option value={120}>120 minutes</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optional)
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Any special requests or information for the tutor..."
            />
          </div>

          <button
            type="submit"
            disabled={loading || !selectedDate || !selectedTime || !subject}
            className="w-full bg-gradient-to-r from-pink-600 to-pink-700 text-white px-6 py-3 rounded-md hover:from-pink-700 hover:to-pink-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all shadow-md hover:shadow-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {isGroupClass && selectedGroupClassToJoin ? 'Joining Group Class...' : 'Creating Booking...'}
              </span>
            ) : (
              isGroupClass && selectedGroupClassToJoin ? 'Join Group Class & Continue to Payment' : 'Continue to Payment'
            )}
          </button>
        </form>
      </div>

      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Booking Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-gray-600">Tutor:</span>
                <span className="font-medium text-gray-900">{tutor.user?.name}</span>
            </div>
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="text-gray-600">Hourly Rate:</span>
                <span className="font-medium text-gray-900">${tutor.hourlyRate}/hr</span>
            </div>
              <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-gray-600">Duration:</span>
                <span className="font-medium text-gray-900">{duration} minutes</span>
              </div>
              {selectedDate && selectedTime && (
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <div className="text-xs text-gray-500 mb-1">Scheduled for:</div>
                  <div className="font-medium text-gray-900">{formatDate(selectedDate)}</div>
                  <div className="font-medium text-gray-900">{selectedTime}</div>
                </div>
              )}
              <div className="pt-3 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total:</span>
                  <span className="text-2xl font-bold text-pink-600">${price}</span>
            </div>
                <p className="text-xs text-gray-500 mt-1">Payment will be processed after booking confirmation</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

