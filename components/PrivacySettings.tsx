'use client'

import { useState, useEffect } from 'react'
import { Shield } from 'lucide-react'

export default function PrivacySettings() {
  const [settings, setSettings] = useState({
    profileVisibility: 'PUBLIC',
    showEmail: false,
    showPhone: false,
  })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings/privacy')
      if (response.ok) {
        const data = await response.json()
        setSettings({
          profileVisibility: data.profileVisibility || 'PUBLIC',
          showEmail: data.showEmail || false,
          showPhone: data.showPhone || false,
        })
      }
    } catch (err) {
      console.error('Failed to fetch privacy settings:', err)
    }
  }

  const handleChange = async (key: string, value: string | boolean) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    setLoading(true)
    setSaved(false)

    try {
      const response = await fetch('/api/settings/privacy', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      })

      if (response.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (err) {
      console.error('Failed to save privacy settings:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center gap-3 mb-4">
        <Shield className="h-6 w-6 text-purple-600" />
        <h3 className="font-semibold text-gray-800">Privacy Settings</h3>
        {saved && (
          <span className="text-xs text-green-600 ml-auto">Saved!</span>
        )}
      </div>
      <div className="space-y-4">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-gray-700">Profile Visibility</span>
          <select
            value={settings.profileVisibility}
            onChange={(e) => handleChange('profileVisibility', e.target.value)}
            disabled={loading}
            className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
          >
            <option value="PUBLIC">Public</option>
            <option value="PRIVATE">Private</option>
          </select>
        </label>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-gray-700">Show Email</span>
          <input
            type="checkbox"
            checked={settings.showEmail}
            onChange={(e) => handleChange('showEmail', e.target.checked)}
            disabled={loading}
            className="rounded"
          />
        </label>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-gray-700">Show Phone</span>
          <input
            type="checkbox"
            checked={settings.showPhone}
            onChange={(e) => handleChange('showPhone', e.target.checked)}
            disabled={loading}
            className="rounded"
          />
        </label>
      </div>
    </div>
  )
}

