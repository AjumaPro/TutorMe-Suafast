'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Booking {
  id: string
  scheduledAt: Date | string
  subject: string
}

interface TutoringScheduleProps {
  bookings: Booking[]
}

export default function TutoringSchedule({ bookings }: TutoringScheduleProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const getWeekDates = (date: Date) => {
    const startOfWeek = new Date(date)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day
    startOfWeek.setDate(diff)

    const dates = []
    for (let i = 0; i < 14; i++) {
      const current = new Date(startOfWeek)
      current.setDate(startOfWeek.getDate() + i)
      dates.push(current)
    }
    return dates
  }

  const weekDates = getWeekDates(currentDate)
  const firstWeek = weekDates.slice(0, 7)
  const secondWeek = weekDates.slice(7, 14)

  const getBookingsForDate = (date: Date) => {
    return bookings.filter((booking) => {
      const bookingDate = new Date(booking.scheduledAt)
      return (
        bookingDate.getDate() === date.getDate() &&
        bookingDate.getMonth() === date.getMonth() &&
        bookingDate.getFullYear() === date.getFullYear()
      )
    })
  }

  const previousWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() - 7)
    setCurrentDate(newDate)
  }

  const nextWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + 7)
    setCurrentDate(newDate)
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="bg-gradient-to-br from-pink-400 to-pink-500 rounded-xl p-6 text-white shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Tutoring Schedule</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={previousWeek}
            className="p-1 hover:bg-pink-600 rounded transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={nextWeek}
            className="p-1 hover:bg-pink-600 rounded transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-sm font-medium opacity-90">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {firstWeek.map((date, idx) => {
          const dayBookings = getBookingsForDate(date)
          const isToday =
            date.toDateString() === new Date().toDateString()
          return (
            <div
              key={idx}
              className={`aspect-square rounded-lg p-1 flex flex-col items-center justify-center ${
                isToday ? 'bg-yellow-400 text-gray-900' : 'bg-white/20'
              }`}
            >
              <span className="text-xs font-medium">{date.getDate()}</span>
              {dayBookings.length > 0 && (
                <div className="mt-1 flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center">
                    <span className="text-[8px]">💬</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {secondWeek.map((date, idx) => {
          const dayBookings = getBookingsForDate(date)
          const isToday =
            date.toDateString() === new Date().toDateString()
          const bookingCount = dayBookings.length
          return (
            <div
              key={idx}
              className={`aspect-square rounded-lg p-1 flex flex-col items-center justify-center relative ${
                isToday ? 'bg-yellow-400 text-gray-900' : 'bg-white/20'
              }`}
            >
              <span className="text-xs font-medium">{date.getDate()}</span>
              {bookingCount > 0 && (
                <>
                  <div className="mt-1 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center">
                      <span className="text-[8px]">💬</span>
                    </div>
                  </div>
                  {bookingCount > 1 && (
                    <div className="absolute -top-1 -right-1 bg-yellow-400 text-gray-900 text-[8px] px-1 rounded-full font-bold">
                      {bookingCount} shift
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

