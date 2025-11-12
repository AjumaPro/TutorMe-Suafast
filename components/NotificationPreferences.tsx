'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'

export default function NotificationPreferences() {
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
  })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/settings/notifications')
      if (response.ok) {
        const data = await response.json()
        setPreferences(data)
      }
    } catch (err) {
      console.error('Failed to fetch preferences:', err)
    }
  }

  const handleChange = async (key: string, value: boolean) => {
    const newPreferences = { ...preferences, [key]: value }
    setPreferences(newPreferences)
    setLoading(true)
    setSaved(false)

    try {
      const response = await fetch('/api/settings/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPreferences),
      })

      if (response.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (err) {
      console.error('Failed to save preferences:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center gap-3 mb-4">
        <Bell className="h-6 w-6 text-pink-600" />
        <h3 className="font-semibold text-gray-800">Notification Preferences</h3>
        {saved && (
          <span className="text-xs text-green-600 ml-auto">Saved!</span>
        )}
      </div>
      <div className="space-y-4">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-gray-700">Email Notifications</span>
          <input
            type="checkbox"
            checked={preferences.emailNotifications}
            onChange={(e) => handleChange('emailNotifications', e.target.checked)}
            disabled={loading}
            className="rounded"
          />
        </label>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-gray-700">Push Notifications</span>
          <input
            type="checkbox"
            checked={preferences.pushNotifications}
            onChange={(e) => handleChange('pushNotifications', e.target.checked)}
            disabled={loading}
            className="rounded"
          />
        </label>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-gray-700">SMS Notifications</span>
          <input
            type="checkbox"
            checked={preferences.smsNotifications}
            onChange={(e) => handleChange('smsNotifications', e.target.checked)}
            disabled={loading}
            className="rounded"
          />
        </label>
      </div>
    </div>
  )
}

