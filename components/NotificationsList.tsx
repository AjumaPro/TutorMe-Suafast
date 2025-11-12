'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Check, CheckCheck } from 'lucide-react'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  link: string | null
  isRead: boolean
  createdAt: string
}

interface NotificationsListProps {
  initialNotifications: Notification[]
}

export default function NotificationsList({ initialNotifications }: NotificationsListProps) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [markingAll, setMarkingAll] = useState(false)

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      })

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      )
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }

  const markAllAsRead = async () => {
    setMarkingAll(true)
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true }),
      })

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    } finally {
      setMarkingAll(false)
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="bg-white rounded-xl shadow-md">
      {notifications.length === 0 ? (
        <div className="p-12 text-center">
          <CheckCheck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No notifications</h3>
          <p className="text-gray-600">You&apos;re all caught up!</p>
        </div>
      ) : (
        <>
          {unreadCount > 0 && (
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
              </span>
              <button
                onClick={markAllAsRead}
                disabled={markingAll}
                className="text-sm text-pink-600 hover:text-pink-700 font-medium disabled:opacity-50 flex items-center gap-1"
              >
                <CheckCheck className="h-4 w-4" />
                Mark all as read
              </button>
            </div>
          )}

          <div className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  !notification.isRead ? 'bg-pink-50' : ''
                }`}
              >
                {notification.link ? (
                  <Link
                    href={notification.link}
                    onClick={() => {
                      if (!notification.isRead) {
                        markAsRead(notification.id)
                      }
                    }}
                    className="block"
                  >
                    <NotificationContent notification={notification} />
                  </Link>
                ) : (
                  <NotificationContent notification={notification} />
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function NotificationContent({ notification }: { notification: Notification }) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
          !notification.isRead ? 'bg-pink-500' : 'bg-transparent'
        }`}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="font-medium text-gray-800">{notification.title}</p>
            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
            <p className="text-xs text-gray-400 mt-2">
              {new Date(notification.createdAt).toLocaleString()}
            </p>
          </div>
          {notification.isRead && (
            <Check className="h-5 w-5 text-gray-400 flex-shrink-0" />
          )}
        </div>
      </div>
    </div>
  )
}

