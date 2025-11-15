'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, CheckCircle, XCircle } from 'lucide-react'

interface AvailabilitySlot {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  isAvailable: boolean
}

interface TutorAvailabilityViewProps {
  tutorId: string
  onTimeSelect?: (dayOfWeek: number, startTime: string, endTime: string) => void
  selectedDate?: Date
  selectedTime?: string
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function TutorAvailabilityView({
  tutorId,
  onTimeSelect,
  selectedDate,
  selectedTime,
}: TutorAvailabilityViewProps) {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAvailability()
  }, [tutorId])

  const fetchAvailability = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/availability?tutorId=${tutorId}`)
      if (response.ok) {
        const data = await response.json()
        setSlots(data.slots || [])
      } else {
        setError('Failed to load availability')
      }
    } catch (err) {
      console.error('Failed to fetch availability:', err)
      setError('Failed to load availability')
    } finally {
      setLoading(false)
    }
  }

  const getAvailableSlotsForDay = (dayOfWeek: number) => {
    return slots.filter((slot) => slot.dayOfWeek === dayOfWeek && slot.isAvailable)
  }

  const formatTimeRange = (startTime: string, endTime: string) => {
    return `${startTime} - ${endTime}`
  }

  const getDayName = (dayOfWeek: number) => {
    return DAYS[dayOfWeek]
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto"></div>
        <p className="text-gray-600 mt-2">Loading availability...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    )
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">This tutor hasn't set their availability yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-5 w-5 text-pink-600" />
        <h3 className="text-lg font-semibold text-gray-800">Available Hours</h3>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
        {DAYS.map((day, dayIndex) => {
          const daySlots = getAvailableSlotsForDay(dayIndex)
          if (daySlots.length === 0) return null

          return (
            <div key={dayIndex} className="flex items-center gap-4 py-2 border-b border-gray-100 last:border-0">
              <div className="w-24 font-medium text-gray-700">{day}:</div>
              <div className="flex-1 flex flex-wrap gap-2">
                {daySlots.map((slot) => {
                  const isSelected =
                    selectedDate?.getDay() === dayIndex &&
                    selectedTime &&
                    selectedTime >= slot.startTime &&
                    selectedTime < slot.endTime

                  return (
                    <button
                      key={slot.id}
                      onClick={() => onTimeSelect?.(dayIndex, slot.startTime, slot.endTime)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                        isSelected
                          ? 'bg-pink-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Clock className="h-3 w-3" />
                      {formatTimeRange(slot.startTime, slot.endTime)}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> These are the tutor's general weekly availability. When booking,
          you'll select a specific date and time within these hours.
        </p>
      </div>
    </div>
  )
}

