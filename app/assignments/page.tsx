import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase-db'
import AssignmentsList from '@/components/AssignmentsList'

export default async function AssignmentsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  let assignments: any[] = []

  if (session.user.role === 'PARENT') {
    const { data: assignmentsData } = await supabase
      .from('assignments')
      .select('*')
      .eq('studentId', session.user.id)
      .order('createdAt', { ascending: false })
    
    assignments = assignmentsData || []
    
    // Fetch related booking and tutor data
    for (const assignment of assignments) {
      if (assignment.bookingId) {
        const { data: booking } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', assignment.bookingId)
          .single()
        
        if (booking) {
          assignment.booking = booking
          if (booking.tutorId) {
            const { data: tutor } = await supabase
              .from('tutor_profiles')
              .select('*')
              .eq('id', booking.tutorId)
              .single()
            
            if (tutor) {
              assignment.booking.tutor = tutor
              if (tutor.userId) {
                const { data: tutorUser } = await supabase
                  .from('users')
                  .select('name')
                  .eq('id', tutor.userId)
                  .single()
                assignment.booking.tutor.user = tutorUser || null
              }
            }
          }
        }
      }
    }
  } else if (session.user.role === 'TUTOR') {
    const { data: tutorProfile } = await supabase
      .from('tutor_profiles')
      .select('*')
      .eq('userId', session.user.id)
      .single()

    if (tutorProfile) {
      const { data: assignmentsData } = await supabase
        .from('assignments')
        .select('*')
        .eq('tutorId', tutorProfile.id)
        .order('createdAt', { ascending: false })
      
      assignments = assignmentsData || []
      
      // Fetch related booking and student data
      for (const assignment of assignments) {
        if (assignment.bookingId) {
          const { data: booking } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', assignment.bookingId)
            .single()
          
          if (booking) {
            assignment.booking = booking
            if (booking.studentId) {
              const { data: student } = await supabase
                .from('users')
                .select('name')
                .eq('id', booking.studentId)
                .single()
              assignment.booking.student = student || null
            }
          }
        }
      }
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

