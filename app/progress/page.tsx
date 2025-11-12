import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import ProgressTracker from '@/components/ProgressTracker'

export default async function ProgressPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Progress Tracking</h1>
          <p className="text-gray-600">
            {session.user.role === 'PARENT'
              ? 'Track your learning progress and achievements'
              : 'Monitor your students\' progress and performance'}
          </p>
        </div>

        <ProgressTracker
          studentId={session.user.role === 'PARENT' ? session.user.id : undefined}
        />
      </div>
    </div>
  )
}

