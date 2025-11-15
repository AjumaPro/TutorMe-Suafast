'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Bell, CheckCircle, X, BookOpen, DollarSign, MessageSquare, Award } from 'lucide-react'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  link?: string
  createdAt: string
}

interface TutorNotificationsPanelProps {
  notifications: Notification[]
}

export default function TutorNotificationsPanel({ notifications: initialNotifications }: TutorNotificationsPanelProps) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [showAll, setShowAll] = useState(false)

  const unreadCount = notifications.filter((n) => !n.isRead).length
  const displayNotifications = showAll ? notifications : notifications.slice(0, 5)

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId, isRead: true }),
      })

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
        )
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true }),
      })

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'BOOKING_CREATED':
      case 'BOOKING_CONFIRMED':
        return <BookOpen className="h-5 w-5 text-blue-500" />
      case 'PAYMENT_RECEIVED':
        return <DollarSign className="h-5 w-5 text-green-500" />
      case 'MESSAGE_RECEIVED':
        return <MessageSquare className="h-5 w-5 text-purple-500" />
      case 'REVIEW_RECEIVED':
        return <Award className="h-5 w-5 text-yellow-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-pink-600" />
          <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-1 bg-pink-100 text-pink-800 rounded-full text-xs font-bold">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-xs text-pink-600 hover:text-pink-700 font-medium"
          >
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-8">
          <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No notifications</p>
          <p className="text-gray-400 text-xs mt-1">You&apos;re all caught up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 rounded-lg border transition-colors ${
                notification.isRead
                  ? 'bg-gray-50 border-gray-200'
                  : 'bg-pink-50 border-pink-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4
                        className={`text-sm font-medium mb-1 ${
                          notification.isRead ? 'text-gray-700' : 'text-gray-900'
                        }`}
                      >
                        {notification.title}
                      </h4>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="p-1 hover:bg-pink-100 rounded transition-colors"
                        title="Mark as read"
                      >
                        <CheckCircle className="h-4 w-4 text-pink-600" />
                      </button>
                    )}
                  </div>
                  {notification.link && (
                    <Link
                      href={notification.link}
                      className="mt-2 inline-block text-xs text-pink-600 hover:text-pink-700 font-medium"
                      onClick={() => markAsRead(notification.id)}
                    >
                      View →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}

          {notifications.length > 5 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full mt-3 text-sm text-pink-600 hover:text-pink-700 font-medium"
            >
              {showAll ? 'Show Less' : `Show All (${notifications.length})`}
            </button>
          )}

          {notifications.length > 0 && (
            <Link
              href="/notifications"
              className="block mt-4 text-center text-sm text-pink-600 hover:text-pink-700 font-medium"
            >
              View All Notifications →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

