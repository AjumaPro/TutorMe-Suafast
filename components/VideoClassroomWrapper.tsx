'use client'

import { useState, useEffect } from 'react'
import VideoClassroom from './VideoClassroom'
import { useSession } from 'next-auth/react'

interface VideoClassroomWrapperProps {
  booking: {
    id: string
    lessonType: string
    scheduledAt: Date | string
    duration: number
    subject: string
    notes?: string | null
    tutor: {
      user: {
        name: string
        email: string
      }
    }
    student: {
      name: string
      email: string
    }
    address?: {
      street: string
      city: string
      state: string
      zipCode: string
    }
  }
  userRole: string
  sessionToken?: string
}

export default function VideoClassroomWrapper({ booking, userRole, sessionToken: initialSessionToken }: VideoClassroomWrapperProps) {
  const { data: session } = useSession()
  const [sessionToken, setSessionToken] = useState<string | undefined>(initialSessionToken)
  const [loading, setLoading] = useState(!initialSessionToken)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // If session token is not provided, fetch it
    if (!sessionToken && booking.lessonType === 'ONLINE') {
      const fetchSessionToken = async () => {
        try {
          setLoading(true)
          const response = await fetch(`/api/video/session?bookingId=${booking.id}`, {
            credentials: 'include',
          })

          if (response.ok) {
            const data = await response.json()
            setSessionToken(data.sessionToken)
          } else if (response.status === 404) {
            // Session doesn't exist, try to create it
            const createResponse = await fetch('/api/video/session', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({ bookingId: booking.id }),
            })

            if (createResponse.ok) {
              const createData = await createResponse.json()
              setSessionToken(createData.sessionToken)
            } else {
              setError('Failed to create video session')
            }
          } else {
            setError('Failed to get video session')
          }
        } catch (err) {
          console.error('Error fetching session token:', err)
          setError('Failed to initialize video session')
        } finally {
          setLoading(false)
        }
      }

      fetchSessionToken()
    } else {
      setLoading(false)
    }
  }, [booking.id, booking.lessonType, sessionToken])

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Initializing video session...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl shadow-md p-6">
        <p className="text-red-800">{error}</p>
      </div>
    )
  }

  return <VideoClassroom booking={booking} userRole={userRole} sessionToken={sessionToken} />
}

