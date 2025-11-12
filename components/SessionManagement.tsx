'use client'

import { useState, useEffect } from 'react'
import { Smartphone, Monitor, Tablet, LogOut, MapPin, Clock } from 'lucide-react'

interface Session {
  id: string
  device: string
  browser: string
  location: string
  ipAddress: string
  lastActive: string
  isCurrent: boolean
}

export default function SessionManagement() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/settings/sessions')
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions || [])
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err)
    }
  }

  const handleSignOut = async (sessionId: string) => {
    if (!confirm('Are you sure you want to sign out from this device?')) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/settings/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })

      if (response.ok) {
        fetchSessions()
      }
    } catch (err) {
      console.error('Failed to sign out session:', err)
    } finally {
      setLoading(false)
    }
  }

  const getDeviceIcon = (device: string) => {
    if (device.toLowerCase().includes('mobile') || device.toLowerCase().includes('phone')) {
      return <Smartphone className="h-5 w-5" />
    } else if (device.toLowerCase().includes('tablet')) {
      return <Tablet className="h-5 w-5" />
    }
    return <Monitor className="h-5 w-5" />
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2 flex items-center gap-2">
          <Smartphone className="h-6 w-6 text-pink-600" />
          Active Sessions
        </h2>
        <p className="text-gray-600 text-sm">Manage devices where you&apos;re signed in</p>
      </div>

      {sessions.length === 0 ? (
        <div className="border border-gray-200 rounded-lg p-12 text-center">
          <Smartphone className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No active sessions</h3>
          <p className="text-gray-600">You&apos;re not signed in on any devices</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`border rounded-lg p-4 ${
                session.isCurrent
                  ? 'border-pink-500 bg-pink-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`p-3 rounded-lg ${
                    session.isCurrent ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {getDeviceIcon(session.device)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-800">{session.device}</h3>
                      {session.isCurrent && (
                        <span className="px-2 py-1 bg-pink-600 text-white text-xs rounded-full font-medium">
                          Current Session
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{session.browser}</p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {session.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(session.lastActive).toLocaleString()}
                      </div>
                      <span>IP: {session.ipAddress}</span>
                    </div>
                  </div>
                </div>
                {!session.isCurrent && (
                  <button
                    onClick={() => handleSignOut(session.id)}
                    disabled={loading}
                    className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors font-medium text-sm flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Security Tip:</strong> If you see any suspicious activity, sign out from all devices and change your password immediately.
        </p>
      </div>
    </div>
  )
}

