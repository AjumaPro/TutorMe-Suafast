'use client'

import { useState } from 'react'
import { Video, Copy, Check, Loader2, ExternalLink } from 'lucide-react'
import { useSession } from 'next-auth/react'

export default function StartLiveSession() {
  const { data: session } = useSession()
  const [isStarting, setIsStarting] = useState(false)
  const [sessionData, setSessionData] = useState<{
    sessionToken: string
    joinLink: string
  } | null>(null)
  const [copied, setCopied] = useState(false)
  const [subject, setSubject] = useState('')

  const startSession = async () => {
    if (!session || session.user.role !== 'TUTOR') return

    setIsStarting(true)
    try {
      const response = await fetch('/api/video/live/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ subject: subject || undefined }),
      })

      if (response.ok) {
        const data = await response.json()
        setSessionData({
          sessionToken: data.sessionToken,
          joinLink: data.joinLink,
        })
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to start session')
      }
    } catch (error) {
      console.error('Error starting session:', error)
      alert('Failed to start session')
    } finally {
      setIsStarting(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const joinSession = () => {
    if (sessionData) {
      window.open(`/live/${sessionData.sessionToken}`, '_blank')
    }
  }

  if (sessionData) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <h2 className="text-lg font-semibold text-gray-800">Live Session Active</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share this link with students:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={sessionData.joinLink}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
              />
              <button
                onClick={() => copyToClipboard(sessionData.joinLink)}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title="Copy link"
              >
                {copied ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <Copy className="h-5 w-5 text-gray-600" />
                )}
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={joinSession}
              className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Video className="h-4 w-4" />
              Join Session
            </button>
            <button
              onClick={async () => {
                if (sessionData) {
                  try {
                    await fetch(`/api/video/live/${sessionData.sessionToken}/end`, {
                      method: 'POST',
                      credentials: 'include',
                    })
                  } catch (error) {
                    console.error('Error ending session:', error)
                  }
                }
                setSessionData(null)
                setSubject('')
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              End Session
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> Share the link above with your students. They can join the session by clicking the link.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center gap-2 mb-4">
        <Video className="h-5 w-5 text-pink-600" />
        <h2 className="text-lg font-semibold text-gray-800">Start Live Session</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject/Topic (Optional)
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g., Math Tutoring, Q&A Session"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>

        <button
          onClick={startSession}
          disabled={isStarting}
          className="w-full px-4 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isStarting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Starting Session...
            </>
          ) : (
            <>
              <Video className="h-5 w-5" />
              Start Live Session
            </>
          )}
        </button>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-sm text-gray-600">
            <strong>How it works:</strong> Start a live session and share the link with your students. They can join instantly without needing a booking.
          </p>
        </div>
      </div>
    </div>
  )
}

