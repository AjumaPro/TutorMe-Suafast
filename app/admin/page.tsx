import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase-db'

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

const AdminPricingPanel = dynamic(() => import('@/components/AdminPricingPanel'), {
  ssr: false,
})

const TutorStatisticsPanel = dynamic(() => import('@/components/TutorStatisticsPanel'), {
  ssr: false,
})

const TutorPaymentsPanel = dynamic(() => import('@/components/TutorPaymentsPanel'), {
  ssr: false,
})

const TutorPaymentsOverview = dynamic(() => import('@/components/TutorPaymentsOverview'), {
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

  // Fetch all data using Supabase
  const [
    pendingTutorsData,
    approvedTutorsData,
    studentsData,
    tutorsData,
    bookingsData,
    paymentsData,
    videoSessionsData,
  ] = await Promise.all([
    // Pending tutors
    supabase
      .from('tutor_profiles')
      .select('*')
      .eq('isApproved', false)
      .order('createdAt', { ascending: false }),
    // Approved tutors (include isActive filter if column exists)
    supabase
      .from('tutor_profiles')
      .select('*')
      .eq('isApproved', true)
      .order('createdAt', { ascending: false }),
    // Students (PARENT role users)
    supabase
      .from('users')
      .select('*')
      .eq('role', 'PARENT')
      .order('createdAt', { ascending: false }),
    // All tutors
    supabase
      .from('tutor_profiles')
      .select('*'),
    // All bookings
    supabase
      .from('bookings')
      .select('*')
      .order('scheduledAt', { ascending: false }),
    // Payments for revenue calculation
    supabase
      .from('payments')
      .select('platformFee')
      .eq('status', 'PAID'),
    // Video sessions count
    supabase
      .from('video_sessions')
      .select('*', { count: 'exact', head: true }),
  ])

  // Fetch related user data for tutors
  const pendingTutors = await Promise.all(
    (pendingTutorsData.data || []).map(async (tutor: any) => {
      const { data: user } = await supabase
        .from('users')
        .select('name, email, createdAt')
        .eq('id', tutor.userId)
        .single()
      return { ...tutor, user: user || null }
    })
  )

  const approvedTutors = await Promise.all(
    (approvedTutorsData.data || []).map(async (tutor: any) => {
      const { data: user } = await supabase
        .from('users')
        .select('name, email, createdAt')
        .eq('id', tutor.userId)
        .single()
      return { ...tutor, user: user || null }
    })
  )

  const tutors = await Promise.all(
    (tutorsData.data || []).map(async (tutor: any) => {
      const { data: user } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', tutor.userId)
        .single()
      return { ...tutor, user: user || null }
    })
  )

  // Fetch bookings and related data for students
  const students = await Promise.all(
    (studentsData.data || []).map(async (student: any) => {
      const { data: studentBookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('studentId', student.id)
      
      const bookingsWithTutors = await Promise.all(
        (studentBookings || []).map(async (booking: any) => {
          if (booking.tutorId) {
            const { data: tutor } = await supabase
              .from('tutor_profiles')
              .select('*')
              .eq('id', booking.tutorId)
              .single()
            
            if (tutor?.userId) {
              const { data: tutorUser } = await supabase
                .from('users')
                .select('*')
                .eq('id', tutor.userId)
                .single()
              return { ...booking, tutor: { ...tutor, user: tutorUser || null } }
            }
            return { ...booking, tutor: tutor || null }
          }
          return booking
        })
      )
      
      return { ...student, bookings: bookingsWithTutors }
    })
  )

  // Fetch related data for bookings
  const bookings = await Promise.all(
    (bookingsData.data || []).map(async (booking: any) => {
      let student = null
      if (booking.studentId) {
        const { data: studentData } = await supabase
          .from('users')
          .select('name, email')
          .eq('id', booking.studentId)
          .single()
        student = studentData || null
      }
      
      let tutor = null
      if (booking.tutorId) {
        const { data: tutorData } = await supabase
          .from('tutor_profiles')
          .select('*')
          .eq('id', booking.tutorId)
          .single()
        
        if (tutorData?.userId) {
          const { data: tutorUser } = await supabase
            .from('users')
            .select('name, email')
            .eq('id', tutorData.userId)
            .single()
          tutor = { ...tutorData, user: tutorUser || null }
        } else {
          tutor = tutorData || null
        }
      }
      
      return {
        ...booking,
        student: student,
        tutor: tutor,
      }
    })
  )

  // Calculate total revenue from payments
  const totalRevenue = (paymentsData.data || []).reduce(
    (sum: number, p: any) => sum + (p.platformFee || 0),
    0
  )

  const payments = { _sum: { platformFee: totalRevenue } }
  const videoSessions = videoSessionsData.count || 0

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
          <TutorApprovalPanel 
            pendingTutors={pendingTutors} 
            approvedTutors={approvedTutors}
            students={students}
          />
        )}
        {activeTab === 'students' && (
          <StudentManagementPanel students={students} tutors={tutors} />
        )}
        {activeTab === 'assignments' && (
          <ClassAssignmentsPanel assignments={bookings} students={students} tutors={tutors} />
        )}
        {activeTab === 'pricing' && (
          <AdminPricingPanel />
        )}
        {activeTab === 'statistics' && (
          <TutorStatisticsPanel />
        )}
        {activeTab === 'payments' && (
          <TutorPaymentsPanel />
        )}
        {activeTab === 'tutor-payments' && (
          <TutorPaymentsOverview />
        )}
      </div>
    </div>
  )
}

