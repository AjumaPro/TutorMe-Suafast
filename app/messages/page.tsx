import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase-db'
import MessagesPageClient from '@/components/MessagesPageClient'

export default async function MessagesPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  // Fetch conversations based on user role
  let conversations: any[] = []

  if (session.user.role === 'PARENT') {
    const { data: bookingsData } = await supabase
      .from('bookings')
      .select('*')
      .eq('studentId', session.user.id)
    
    const bookings = bookingsData || []
    
    // Get unique tutor IDs
    const tutorIds = [...new Set(bookings.map(b => b.tutorId).filter(Boolean))]
    
    // Fetch tutor profiles and users
    const tutorMap = new Map()
    for (const tutorId of tutorIds) {
      const { data: tutor } = await supabase
        .from('tutor_profiles')
        .select('*')
        .eq('id', tutorId)
        .single()
      
      if (tutor?.userId) {
        const { data: tutorUser } = await supabase
          .from('users')
          .select('name, email, image')
          .eq('id', tutor.userId)
          .single()
        
        if (tutorUser) {
          tutorMap.set(tutorId, {
            id: tutorId,
            userId: tutor.userId,
            name: tutorUser.name,
            email: tutorUser.email,
            image: tutorUser.image,
            role: 'Tutor',
          })
        }
      }
    }
    
    conversations = Array.from(tutorMap.values())
  } else if (session.user.role === 'TUTOR') {
    // Get tutor profile first
    const { data: tutorProfile } = await supabase
      .from('tutor_profiles')
      .select('*')
      .eq('userId', session.user.id)
      .single()
    
    if (tutorProfile) {
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('*')
        .eq('tutorId', tutorProfile.id)
      
      const bookings = bookingsData || []
      
      // Get unique student IDs
      const studentIds = [...new Set(bookings.map(b => b.studentId).filter(Boolean))]
      
      // Fetch student users
      for (const studentId of studentIds) {
        const { data: student } = await supabase
          .from('users')
          .select('name, email, image')
          .eq('id', studentId)
          .single()
        
        if (student) {
          conversations.push({
            id: studentId,
            userId: studentId,
            name: student.name || 'Unknown Student',
            email: student.email || '',
            image: student.image || null,
            role: 'Student',
          })
        }
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages</h1>
          <p className="text-gray-600">Chat with your students and tutors</p>
        </div>

        <MessagesPageClient conversations={conversations} currentUserId={session.user.id} />
      </div>
    </div>
  )
}

