import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import { prisma } from '@/lib/prisma'
import RecurringBookingForm from '@/components/RecurringBookingForm'

export default async function RecurringBookTutorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'PARENT') {
    redirect('/auth/signin')
  }

  const { id } = await params
  const tutor = await prisma.tutorProfile.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  })

  if (!tutor || !tutor.isApproved) {
    redirect('/search')
  }

  const studentAddresses = await prisma.address.findMany({
    where: { userId: session.user.id },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Book Recurring Lessons with {tutor.user.name}
        </h1>
        <RecurringBookingForm tutor={tutor} studentAddresses={studentAddresses} />
      </div>
    </div>
  )
}

