import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import { prisma } from '@/lib/prisma'

// Dynamically import client components
const AdminTabs = dynamic(() => import('@/components/AdminTabs'), {
  ssr: false,
  loading: () => <div className="border-b border-gray-200 mb-6 h-16" />,
})

const AdminOverviewPanel = dynamic(() => import('@/components/AdminOverviewPanel'), {
  ssr: false,
})

const TutorApprovalPanel = dynamic(() => import('@/components/TutorApprovalPanel'), {
  ssr: false,
})

const StudentManagementPanel = dynamic(() => import('@/components/StudentManagementPanel'), {
  ssr: false,
})

const ClassAssignmentsPanel = dynamic(() => import('@/components/ClassAssignmentsPanel'), {
  ssr: false,
})

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  const activeTab = (searchParams.tab as string) || 'overview'

  // Fetch all data
  const [pendingTutors, approvedTutors, students, tutors, bookings, payments, videoSessions] =
    await Promise.all([
      prisma.tutorProfile.findMany({
        where: { isApproved: false },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.tutorProfile.findMany({
        where: { isApproved: true },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.user.findMany({
        where: { role: 'PARENT' },
        include: {
          bookings: {
            include: {
              tutor: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.tutorProfile.findMany({
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.booking.findMany({
        include: {
          student: {
            select: {
              name: true,
              email: true,
            },
          },
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
        },
        orderBy: {
          scheduledAt: 'desc',
        },
      }),
      prisma.payment.aggregate({
        _sum: { platformFee: true },
        where: { status: 'PAID' },
      }),
      prisma.videoSession.count(),
    ])

  const activeBookings = bookings.filter(
    (b) => b.status === 'CONFIRMED' || b.status === 'PENDING'
  )

  const stats = {
    totalTutors: tutors.length,
    approvedTutors: approvedTutors.length,
    pendingTutors: pendingTutors.length,
    totalStudents: students.length,
    totalBookings: bookings.length,
    activeBookings: activeBookings.length,
    totalRevenue: payments._sum.platformFee || 0,
    totalVideoSessions: videoSessions,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Administration Dashboard</h1>
        <Suspense fallback={<div className="border-b border-gray-200 mb-6 h-16" />}>
          <AdminTabs />
        </Suspense>
        {activeTab === 'overview' && <AdminOverviewPanel stats={stats} />}
        {activeTab === 'tutors' && (
          <TutorApprovalPanel pendingTutors={pendingTutors} approvedTutors={approvedTutors} />
        )}
        {activeTab === 'students' && (
          <StudentManagementPanel students={students} tutors={tutors} />
        )}
        {activeTab === 'assignments' && (
          <ClassAssignmentsPanel assignments={bookings} students={students} tutors={tutors} />
        )}
      </div>
    </div>
  )
}

