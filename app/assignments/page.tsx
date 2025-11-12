import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import { prisma } from '@/lib/prisma'
import AssignmentsList from '@/components/AssignmentsList'

export default async function AssignmentsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  let assignments: any[] = []

  if (session.user.role === 'PARENT') {
    assignments = await prisma.assignment.findMany({
      where: { studentId: session.user.id },
      include: {
        booking: {
          include: {
            tutor: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  } else if (session.user.role === 'TUTOR') {
    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (tutorProfile) {
      assignments = await prisma.assignment.findMany({
        where: { tutorId: tutorProfile.id },
        include: {
          booking: {
            include: {
              student: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Assignments</h1>
          <p className="text-gray-600">
            {session.user.role === 'PARENT'
              ? 'View and submit your assignments'
              : 'Review and grade student assignments'}
          </p>
        </div>

        <AssignmentsList assignments={assignments} userRole={session.user.role} />
      </div>
    </div>
  )
}

