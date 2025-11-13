'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Calendar, Clock, Repeat, DollarSign } from 'lucide-react'
import { formatCurrency, parseCurrencyCode } from '@/lib/currency'

const recurringBookingSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  lessonType: z.enum(['IN_PERSON', 'ONLINE']),
  startDate: z.string().min(1, 'Start date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  duration: z.number().min(30).max(180),
  recurringPattern: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY']),
  numberOfOccurrences: z.number().min(2).max(52),
  addressId: z.string().optional(),
  notes: z.string().optional(),
})

type RecurringBookingFormData = z.infer<typeof recurringBookingSchema>

interface RecurringBookingFormProps {
  tutor: any
  studentAddresses: any[]
}

export default function RecurringBookingForm({
  tutor,
  studentAddresses,
}: RecurringBookingFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<RecurringBookingFormData>({
    resolver: zodResolver(recurringBookingSchema),
    defaultValues: {
      lessonType: 'ONLINE',
      duration: 60,
      recurringPattern: 'WEEKLY',
      numberOfOccurrences: 4,
      startDate: '',
      startTime: '',
    },
  })
  
  // Watch date and time for display
  const selectedDate = watch('startDate')
  const selectedTime = watch('startTime')

  const lessonType = watch('lessonType')
  const duration = watch('duration') || 60
  const recurringPattern = watch('recurringPattern')
  const numberOfOccurrences = watch('numberOfOccurrences') || 4
  const price = ((tutor.hourlyRate * duration) / 60).toFixed(2)
  const totalPrice = (parseFloat(price) * numberOfOccurrences).toFixed(2)

  const tutorSubjects = Array.isArray(tutor.subjects)
    ? tutor.subjects
    : JSON.parse(tutor.subjects || '[]')

  const onSubmit = async (data: RecurringBookingFormData) => {
    console.log('🚀 Recurring booking form submitted:', {
      subject: data.subject,
      lessonType: data.lessonType,
      duration: data.duration,
      recurringPattern: data.recurringPattern,
      numberOfOccurrences: data.numberOfOccurrences,
      startDate: data.startDate,
      startTime: data.startTime,
      price: parseFloat(price),
      addressId: data.addressId,
    })
    
    setLoading(true)
    setError('')

    if (!data.startDate || !data.startTime) {
      setError('Please select both date and time')
      setLoading(false)
      return
    }

    const startDate = new Date(`${data.startDate}T${data.startTime}`)

    if (startDate <= new Date()) {
      setError('Start date must be in the future')
      setLoading(false)
      return
    }

    if (data.lessonType === 'IN_PERSON' && !data.addressId) {
      setError('Please select an address for in-person lessons')
      setLoading(false)
      return
    }

    try {
      const payload = {
        ...data,
        tutorId: tutor.id,
        startDate: startDate.toISOString(),
        price: parseFloat(price),
      }
      
      console.log('📤 Sending recurring booking request:', payload)
      
      const response = await fetch('/api/bookings/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      console.log('📥 Response status:', response.status, response.statusText)

      const result = await response.json()

      if (!response.ok) {
        console.error('Recurring booking creation failed:', result)
        setError(result.details || result.error || 'Failed to create recurring bookings')
        setLoading(false)
        return
      }

      console.log('Recurring bookings created successfully:', result)
      
      // Redirect to payment page
      if (result.parentBooking && result.parentBooking.id) {
        window.location.href = `/bookings/${result.parentBooking.id}/payment`
      } else {
        console.error('Parent booking ID missing in response:', result)
        setError('Bookings created but payment page not available. Please check your bookings.')
        setLoading(false)
      }
    } catch (err) {
      console.error('Recurring booking error:', err)
      setError(`An error occurred: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`)
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <form 
          onSubmit={(e) => {
            console.log('📝 Form onSubmit event triggered')
            handleSubmit(
              (data) => {
                console.log('✅ Form validation passed, calling onSubmit')
                onSubmit(data)
              },
              (errors) => {
                console.error('❌ Form validation failed:', errors)
                setError('Please fill in all required fields correctly')
              }
            )(e)
          }} 
          className="bg-white rounded-lg shadow-md p-6 space-y-6"
        >
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          {Object.keys(errors).length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
              <p className="font-semibold mb-2">Please fix the following errors:</p>
              <ul className="list-disc list-inside space-y-1">
                {Object.entries(errors).map(([field, error]: [string, any]) => (
                  <li key={field} className="text-sm">
                    <strong>{field}:</strong> {error?.message || 'Invalid value'}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center gap-2 mb-4 p-3 bg-pink-50 rounded-lg">
            <Repeat className="h-5 w-5 text-pink-600" />
            <div>
              <h3 className="font-semibold text-pink-900">Recurring Booking</h3>
              <p className="text-sm text-pink-700">
                Book multiple lessons at once and save time
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject *
            </label>
            <select
              {...register('subject')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
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
              <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-pink-500">
                <input
                  type="radio"
                  {...register('lessonType')}
                  value="ONLINE"
                  className="mr-3"
                />
                <div>
                  <span className="font-medium">Online</span>
                </div>
              </label>
              <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-pink-500">
                <input
                  type="radio"
                  {...register('lessonType')}
                  value="IN_PERSON"
                  className="mr-3"
                />
                <div>
                  <span className="font-medium">In-Person</span>
                </div>
              </label>
            </div>
          </div>

          {lessonType === 'IN_PERSON' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address *
              </label>
              <select
                {...register('addressId')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="">Select an address</option>
                {studentAddresses.map((address: any) => (
                  <option key={address.id} value={address.id}>
                    {address.street}, {address.city}, {address.state} {address.zipCode}
                  </option>
                ))}
              </select>
              {errors.addressId && (
                <p className="mt-1 text-sm text-red-600">{errors.addressId.message}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                {...register('startDate', { required: 'Start date is required' })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
              />
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time *
              </label>
              <input
                type="time"
                {...register('startTime', { required: 'Start time is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
              />
              {errors.startTime && (
                <p className="mt-1 text-sm text-red-600">{errors.startTime.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration (minutes) *
            </label>
            <select
              {...register('duration', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
            >
              <option value={30}>30 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
              <option value={120}>120 minutes</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recurring Pattern *
            </label>
            <select
              {...register('recurringPattern')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
            >
              <option value="WEEKLY">Weekly</option>
              <option value="BIWEEKLY">Bi-weekly (Every 2 weeks)</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Lessons *
            </label>
            <input
              type="number"
              {...register('numberOfOccurrences', { valueAsNumber: true })}
              min={2}
              max={52}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              You&apos;ll be charged for all {numberOfOccurrences} lessons upfront
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optional)
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
              placeholder="Any special requests or information for the tutor..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            onClick={(e) => {
              console.log('🔘 Continue to Payment button clicked')
              console.log('Button state:', {
                loading,
                disabled: loading,
                errorsCount: Object.keys(errors).length,
                errors: errors,
                startDate: watch('startDate'),
                startTime: watch('startTime'),
                hasSubject: !!watch('subject'),
                subjectValue: watch('subject'),
              })
              // Don't prevent default - let form submit naturally
            }}
            onMouseDown={() => console.log('🖱️ Button mouse down')}
            className="w-full bg-pink-600 text-white px-6 py-3 rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
          >
            {loading ? 'Creating Bookings...' : 'Continue to Payment'}
          </button>
        </form>
      </div>

      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
          <h3 className="text-lg font-semibold mb-4">Booking Summary</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Tutor:</span>
              <span className="font-medium">{tutor.user.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Rate:</span>
              <span className="font-medium">
                {formatCurrency(tutor.hourlyRate, parseCurrencyCode(tutor.currency))}/hour
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Duration:</span>
              <span className="font-medium">{duration} min</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pattern:</span>
              <span className="font-medium capitalize">{recurringPattern?.toLowerCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Lessons:</span>
              <span className="font-medium">{numberOfOccurrences}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Per lesson:</span>
              <span className="font-medium">
                {formatCurrency(parseFloat(price), parseCurrencyCode(tutor.currency))}
              </span>
            </div>
            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="text-pink-600">
                  {formatCurrency(parseFloat(totalPrice), parseCurrencyCode(tutor.currency))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

