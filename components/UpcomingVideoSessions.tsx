'use client'

import Link from 'next/link'
import { Video, Clock, User, Play, Calendar } from 'lucide-react'
import { format, isToday, isTomorrow, differenceInMinutes } from 'date-fns'

interface UpcomingVideoSessionsProps {
  sessions: Array<{
    id: string
    bookingId: string
    scheduledAt: Date | string
    subject: string
    duration: number
    lessonType: string
    status: string
    otherPerson: {
      name: string
      email: string
    }
  }>
  userRole: string
}

export default function UpcomingVideoSessions({ sessions, userRole }: UpcomingVideoSessionsProps) {
  if (sessions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <Video className="h-5 w-5 text-pink-600" />
          <h2 className="text-lg font-semibold text-gray-800">Upcoming Video Sessions</h2>
        </div>
        <div className="text-center py-8">
          <Video className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No upcoming video sessions</p>
        </div>
      </div>
    )
  }

  const getTimeUntil = (scheduledAt: Date | string) => {
    const now = new Date()
    const scheduled = new Date(scheduledAt)
    const minutes = differenceInMinutes(scheduled, now)
    
    if (minutes < 0) {
      return { text: 'Started', canJoin: true, color: 'text-green-600' }
    } else if (minutes <= 15) {
      return { text: `Starts in ${minutes}m`, canJoin: true, color: 'text-green-600' }
    } else if (minutes <= 60) {
      return { text: `Starts in ${minutes}m`, canJoin: false, color: 'text-blue-600' }
    } else {
      const hours = Math.floor(minutes / 60)
      return { text: `Starts in ${hours}h`, canJoin: false, color: 'text-gray-600' }
    }
  }

  const getDateLabel = (scheduledAt: Date | string) => {
    const scheduled = new Date(scheduledAt)
    if (isToday(scheduled)) {
      return 'Today'
    } else if (isTomorrow(scheduled)) {
      return 'Tomorrow'
    } else {
      return format(scheduled, 'MMM d')
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Video className="h-5 w-5 text-pink-600" />
          <h2 className="text-lg font-semibold text-gray-800">Upcoming Video Sessions</h2>
        </div>
        <Link
          href="/lessons"
          className="text-sm text-pink-600 hover:text-pink-700 font-medium"
        >
          View All
        </Link>
      </div>

      <div className="space-y-3">
        {sessions.slice(0, 3).map((session) => {
          const timeInfo = getTimeUntil(session.scheduledAt)
          const dateLabel = getDateLabel(session.scheduledAt)
          const scheduledDate = new Date(session.scheduledAt)

          return (
            <div
              key={session.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-pink-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                      {session.otherPerson.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate">
                        {session.otherPerson.name}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">{session.subject}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{dateLabel}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {format(scheduledDate, 'h:mm a')} • {session.duration}m
                      </span>
                    </div>
                    <span className={`font-medium ${timeInfo.color}`}>
                      {timeInfo.text}
                    </span>
                  </div>
                </div>

                {timeInfo.canJoin && (
                  <Link
                    href={`/lessons/${session.bookingId}`}
                    className="flex-shrink-0 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium text-sm flex items-center gap-2 whitespace-nowrap"
                  >
                    <Play className="h-4 w-4" />
                    Join
                  </Link>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {sessions.length > 3 && (
        <Link
          href="/lessons"
          className="block mt-4 text-center text-sm text-pink-600 hover:text-pink-700 font-medium"
        >
          View {sessions.length - 3} more session{sessions.length - 3 !== 1 ? 's' : ''}
        </Link>
      )}
    </div>
  )
}

