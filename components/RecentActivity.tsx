'use client'

import { Clock, BookOpen, DollarSign, CheckCircle, XCircle, Calendar, MessageSquare, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface Activity {
  id: string
  type: 'booking' | 'payment' | 'review' | 'message' | 'booking_confirmed' | 'booking_cancelled'
  title: string
  description: string
  timestamp: Date
  link?: string
  icon?: React.ReactNode
}

interface RecentActivityProps {
  activities: Activity[]
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'booking':
      case 'booking_confirmed':
        return <Calendar className="h-4 w-4 text-blue-500" />
      case 'payment':
        return <DollarSign className="h-4 w-4 text-green-500" />
      case 'review':
        return <BookOpen className="h-4 w-4 text-yellow-500" />
      case 'message':
        return <MessageSquare className="h-4 w-4 text-purple-500" />
      case 'booking_cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Recent Activity</h3>
        <Link
          href="/bookings"
          className="text-sm text-pink-600 hover:text-pink-700 font-medium flex items-center gap-1 transition-colors"
        >
          View All
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="space-y-3">
        {activities.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="bg-gray-50 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Clock className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-sm font-medium">No recent activity</p>
            <p className="text-xs text-gray-400 mt-1">Your activity will appear here</p>
          </div>
        ) : (
          activities.map((activity) => (
            <Link
              key={activity.id}
              href={activity.link || '#'}
              className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-all group border border-transparent hover:border-gray-200"
            >
              <div className="flex-shrink-0 mt-0.5">
                <div className="p-2 rounded-lg bg-gray-50 group-hover:bg-gray-100 transition-colors">
                  {activity.icon || getActivityIcon(activity.type)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 group-hover:text-pink-600 transition-colors">
                  {activity.title}
                </p>
                <p className="text-xs text-gray-600 mt-1">{activity.description}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
