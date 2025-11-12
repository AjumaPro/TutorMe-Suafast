import { redirect } from 'next/navigation'
import dynamic from 'next/dynamic'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import { prisma } from '@/lib/prisma'

// Dynamically import VideoClassroomWrapper to avoid webpack issues
const VideoClassroomWrapper = dynamic(() => import('@/components/VideoClassroomWrapper'), {
  ssr: false,
  loading: () => (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading video session...</p>
        </div>
      </div>
    </div>
  ),
})

export default async function LiveSessionPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect(`/auth/signin?callbackUrl=/live/${(await params).token}`)
  }

  const { token } = await params

  // Get video session
  const videoSession = await prisma.videoSession.findUnique({
    where: { sessionToken: token },
    include: {
      tutor: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
      booking: {
        include: {
          student: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
  })

  if (!videoSession) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Session Not Found</h1>
            <p className="text-gray-600 mb-6">
              The session you&apos;re trying to access doesn&apos;t exist or has expired.
            </p>
            <a
              href="/dashboard"
              className="inline-block px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    )
  }

  if (videoSession.status !== 'ACTIVE') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Session Ended</h1>
            <p className="text-gray-600 mb-6">
              This session has ended.
            </p>
            <a
              href="/dashboard"
              className="inline-block px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Check if user is the tutor or a student joining
  const isTutor = videoSession.tutorId && session.user.role === 'TUTOR'
  const tutorProfile = videoSession.tutorId
    ? await prisma.tutorProfile.findUnique({
        where: { userId: session.user.id },
      })
    : null

  if (isTutor && tutorProfile?.id !== videoSession.tutorId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Unauthorized</h1>
            <p className="text-gray-600 mb-6">
              You don&apos;t have permission to access this session.
            </p>
            <a
              href="/dashboard"
              className="inline-block px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Create a mock booking object for the VideoClassroom component
  const mockBooking = {
    id: videoSession.id,
    lessonType: 'ONLINE',
    scheduledAt: videoSession.startedAt,
    duration: 60, // Default duration
    subject: videoSession.subject || 'Live Session',
    notes: videoSession.subject ? `Topic: ${videoSession.subject}` : undefined,
    tutor: {
      user: {
        name: videoSession.tutor?.user.name || 'Tutor',
        email: videoSession.tutor?.user.email || '',
      },
    },
    student: {
      name: session.user.name || 'Student',
      email: session.user.email || '',
    },
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isTutor ? 'Live Session' : 'Join Live Session'}
          </h1>
          {videoSession.tutor && (
            <p className="text-gray-600">
              {isTutor ? 'Your live session' : `Session with ${videoSession.tutor.user.name}`}
              {videoSession.subject && ` • ${videoSession.subject}`}
            </p>
          )}
        </div>

        <VideoClassroomWrapper
          booking={mockBooking}
          userRole={session.user.role}
          sessionToken={videoSession.sessionToken}
        />
      </div>
    </div>
  )
}

