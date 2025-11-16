import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import ServiceFeesInfo from '@/components/ServiceFeesInfo'

export default async function ServiceFeesPage() {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'TUTOR' && session.user.role !== 'ADMIN')) {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ServiceFeesInfo showExamples={true} />
      </div>
    </div>
  )
}

