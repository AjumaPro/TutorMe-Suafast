'use client'

import { Bell, Calendar, Clock, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { format, isToday, isTomorrow, differenceInHours } from 'date-fns'

interface Reminder {
  id: string
  type: 'booking' | 'assignment' | 'payment' | 'deadline'
  title: string
  description: string
  dueDate: Date
  link?: string
  priority?: 'high' | 'medium' | 'low'
}

interface UpcomingRemindersProps {
  reminders: Reminder[]
}

export default function UpcomingReminders({ reminders }: UpcomingRemindersProps) {
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-500 bg-red-50'
      case 'medium':
        return 'border-yellow-500 bg-yellow-50'
      default:
        return 'border-blue-500 bg-blue-50'
    }
  }

  const getTimeLabel = (date: Date) => {
    if (isToday(date)) {
      const hours = differenceInHours(date, new Date())
      if (hours <= 1) return 'In less than 1 hour'
      return `Today at ${format(date, 'h:mm a')}`
    }
    if (isTomorrow(date)) {
      return `Tomorrow at ${format(date, 'h:mm a')}`
    }
    return format(date, 'MMM d, h:mm a')
  }

  const sortedReminders = [...reminders].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  )

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Bell className="h-5 w-5 text-pink-600" />
          Upcoming Reminders
        </h3>
        <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full font-medium">
          {reminders.length}
        </span>
      </div>
      <div className="space-y-3">
        {sortedReminders.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No upcoming reminders</p>
          </div>
        ) : (
          sortedReminders.slice(0, 5).map((reminder) => (
            <Link
              key={reminder.id}
              href={reminder.link || '#'}
              className={`block p-3 rounded-lg border-l-4 ${getPriorityColor(reminder.priority)} hover:shadow-sm transition-all`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-3 w-3 text-gray-500 flex-shrink-0" />
                    <p className="text-xs text-gray-500">{getTimeLabel(reminder.dueDate)}</p>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{reminder.title}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{reminder.description}</p>
                </div>
                {reminder.priority === 'high' && (
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                )}
              </div>
            </Link>
          ))
        )}
      </div>
      {reminders.length > 5 && (
        <Link
          href="/bookings"
          className="block text-center text-sm text-pink-600 hover:text-pink-700 font-medium mt-4"
        >
          View All Reminders
        </Link>
      )}
    </div>
  )
}

