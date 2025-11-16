import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import dynamic from 'next/dynamic'

const TutorPaymentsOverview = dynamic(() => import('@/components/TutorPaymentsOverview'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mb-4"></div>
        <p className="text-gray-600">Loading tutor payments...</p>
      </div>
    </div>
  ),
})

export default async function AdminTutorPaymentsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TutorPaymentsOverview />
      </div>
    </div>
  )
}

