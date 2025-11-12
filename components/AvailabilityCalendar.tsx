'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, Save, X } from 'lucide-react'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const TIME_SLOTS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
  '21:00', '21:30', '22:00'
]

interface AvailabilitySlot {
  id?: string
  dayOfWeek: number
  startTime: string
  endTime: string
  isAvailable: boolean
}

export default function AvailabilityCalendar() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showQuickSetup, setShowQuickSetup] = useState(false)

  useEffect(() => {
    fetchAvailability()
  }, [])

  const fetchAvailability = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/availability')
      if (response.ok) {
        const data = await response.json()
        const fetchedSlots = data.slots || []
        // Map the fetched slots to include dayOfWeek
        const mappedSlots = fetchedSlots.map((slot: any) => ({
          id: slot.id,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isAvailable: slot.isAvailable,
        }))
        setSlots(mappedSlots)
        
        // If no slots exist, show quick setup option
        if (mappedSlots.length === 0) {
          setShowQuickSetup(true)
        }
      }
    } catch (err) {
      console.error('Failed to fetch availability:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleTimeChange = (dayOfWeek: number, field: 'startTime' | 'endTime', value: string) => {
    setSlots((prev) => {
      const existing = prev.find((s) => s.dayOfWeek === dayOfWeek)
      if (existing) {
        return prev.map((s) =>
          s.dayOfWeek === dayOfWeek ? { ...s, [field]: value } : s
        )
      } else {
        return [...prev, { dayOfWeek, startTime: '09:00', endTime: '17:00', isAvailable: true, [field]: value }]
      }
    })
  }

  const toggleDay = (dayOfWeek: number) => {
    setSlots((prev) => {
      const existing = prev.find((s) => s.dayOfWeek === dayOfWeek)
      if (existing) {
        return prev.map((s) =>
          s.dayOfWeek === dayOfWeek ? { ...s, isAvailable: !s.isAvailable } : s
        )
      } else {
        return [...prev, { dayOfWeek, startTime: '09:00', endTime: '17:00', isAvailable: true }]
      }
    })
  }

  const handleQuickSetup = (startTime: string, endTime: string, weekdays: number[]) => {
    setSlots((prev) => {
      const updatedSlots = [...prev]
      weekdays.forEach((dayOfWeek) => {
        const existingIndex = updatedSlots.findIndex((s) => s.dayOfWeek === dayOfWeek)
        if (existingIndex >= 0) {
          updatedSlots[existingIndex] = {
            ...updatedSlots[existingIndex],
            startTime,
            endTime,
            isAvailable: true,
          }
        } else {
          updatedSlots.push({
            dayOfWeek,
            startTime,
            endTime,
            isAvailable: true,
          })
        }
      })
      return updatedSlots
    })
    setShowQuickSetup(false)
  }

  const setWeekdayHours = () => {
    handleQuickSetup('09:00', '17:00', [1, 2, 3, 4, 5]) // Monday to Friday
  }

  const setWeekendHours = () => {
    handleQuickSetup('10:00', '16:00', [0, 6]) // Sunday and Saturday
  }

  const setAllWeek = () => {
    handleQuickSetup('09:00', '17:00', [0, 1, 2, 3, 4, 5, 6]) // All days
  }

  const clearAll = () => {
    setSlots([])
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to save availability')
        return
      }

      setSuccess('Availability updated successfully!')
      // Refresh availability data
      await fetchAvailability()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto"></div>
        <p className="text-gray-600 mt-2">Loading availability...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-1">Availability Schedule</h3>
          <p className="text-sm text-gray-600">Set your weekly availability so students can book lessons with you</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-pink-600 to-pink-700 text-white rounded-lg hover:from-pink-700 hover:to-pink-800 disabled:opacity-50 font-medium transition-all shadow-md hover:shadow-lg"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Availability'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Quick Setup Options */}
      {showQuickSetup && slots.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">Quick Setup</h4>
              <p className="text-sm text-blue-700 mb-3">
                Set your availability quickly with these presets, or customize each day below.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={setWeekdayHours}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                >
                  Weekdays (Mon-Fri, 9 AM - 5 PM)
                </button>
                <button
                  onClick={setWeekendHours}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                >
                  Weekends (Sat-Sun, 10 AM - 4 PM)
                </button>
                <button
                  onClick={setAllWeek}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                >
                  All Week (9 AM - 5 PM)
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowQuickSetup(false)}
              className="text-blue-600 hover:text-blue-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {slots.length > 0 && (
        <div className="flex items-center gap-2">
          <button
            onClick={setWeekdayHours}
            className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors"
          >
            Set Weekdays
          </button>
          <button
            onClick={setWeekendHours}
            className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors"
          >
            Set Weekends
          </button>
          <button
            onClick={setAllWeek}
            className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors"
          >
            Set All Week
          </button>
          <button
            onClick={clearAll}
            className="px-3 py-1.5 bg-red-100 text-red-700 text-sm rounded-md hover:bg-red-200 transition-colors"
          >
            Clear All
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="space-y-4">
          {DAYS.map((day, dayIndex) => {
            const slot = slots.find((s) => s.dayOfWeek === dayIndex)
            const isAvailable = slot?.isAvailable ?? false

            return (
              <div
                key={dayIndex}
                className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="w-32">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAvailable}
                      onChange={() => toggleDay(dayIndex)}
                      className="rounded"
                    />
                    <span className="font-medium text-gray-700">{day}</span>
                  </label>
                </div>

                {isAvailable && (
                  <div className="flex-1 flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <label className="text-sm text-gray-600">From:</label>
                      <select
                        value={slot?.startTime || '09:00'}
                        onChange={(e) => handleTimeChange(dayIndex, 'startTime', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white"
                      >
                        {TIME_SLOTS.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                      <label className="text-sm text-gray-600">To:</label>
                      <select
                        value={slot?.endTime || '17:00'}
                        onChange={(e) => {
                          const startTime = slot?.startTime || '09:00'
                          const selectedEndTime = e.target.value
                          // Ensure end time is after start time
                          if (selectedEndTime > startTime) {
                            handleTimeChange(dayIndex, 'endTime', selectedEndTime)
                          }
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white"
                      >
                        {TIME_SLOTS.filter((time) => {
                          const startTime = slot?.startTime || '09:00'
                          return time > startTime
                        }).map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                    </div>
                    {slot && (() => {
                      const [startH, startM] = slot.startTime.split(':').map(Number)
                      const [endH, endM] = slot.endTime.split(':').map(Number)
                      const startMinutes = startH * 60 + startM
                      const endMinutes = endH * 60 + endM
                      const totalMinutes = endMinutes - startMinutes
                      const hours = Math.floor(totalMinutes / 60)
                      const minutes = totalMinutes % 60
                      const durationText = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
                      return (
                        <div className="text-sm text-gray-500">
                          ({durationText})
                        </div>
                      )
                    })()}
                  </div>
                )}

                {!isAvailable && (
                  <div className="flex-1 text-sm text-gray-500">Not available</div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

