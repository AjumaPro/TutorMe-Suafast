'use client'

import { useState, useEffect } from 'react'
import { Activity, Filter, Calendar } from 'lucide-react'

interface ActivityEntry {
  id: string
  action: string
  description: string
  timestamp: string
  ipAddress: string
  location: string
  type: 'login' | 'booking' | 'payment' | 'profile' | 'security' | 'other'
}

export default function ActivityLog() {
  const [activities, setActivities] = useState<ActivityEntry[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActivities()
  }, [filter])

  const fetchActivities = async () => {
    setLoading(true)
    try {
      const params = filter !== 'all' ? `?type=${filter}` : ''
      const response = await fetch(`/api/settings/activity${params}`)
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities || [])
      }
    } catch (err) {
      console.error('Failed to fetch activities:', err)
    } finally {
      setLoading(false)
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'login':
        return 'bg-blue-100 text-blue-800'
      case 'booking':
        return 'bg-green-100 text-green-800'
      case 'payment':
        return 'bg-purple-100 text-purple-800'
      case 'profile':
        return 'bg-pink-100 text-pink-800'
      case 'security':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2 flex items-center gap-2">
          <Activity className="h-6 w-6 text-pink-600" />
          Activity Log
        </h2>
        <p className="text-gray-600 text-sm">View your account activity and security events</p>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-5 w-5 text-gray-600" />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
        >
          <option value="all">All Activities</option>
          <option value="login">Logins</option>
          <option value="booking">Bookings</option>
          <option value="payment">Payments</option>
          <option value="profile">Profile Changes</option>
          <option value="security">Security Events</option>
        </select>
      </div>

      {/* Activities List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading activities...</p>
        </div>
      ) : activities.length === 0 ? (
        <div className="border border-gray-200 rounded-lg p-12 text-center">
          <Activity className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No activities found</h3>
          <p className="text-gray-600">Your activity log will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-800">{activity.action}</h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getActivityColor(
                        activity.type
                      )}`}
                    >
                      {activity.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{activity.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(activity.timestamp).toLocaleString()}
                </div>
                <span>IP: {activity.ipAddress}</span>
                <span>{activity.location}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

