import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase-db'
import TutorDashboard from '@/components/TutorDashboard'
import { redirect } from 'next/navigation'

export default async function TutorsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const session = await getServerSession(authOptions)

  // Allow public access or require login - you can change this
  // if (!session) {
  //   redirect('/auth/signin')
  // }

  const subject = searchParams.subject as string
  const grade = searchParams.grade as string
  const minRate = searchParams.minRate ? parseFloat(searchParams.minRate as string) : undefined
  const maxRate = searchParams.maxRate ? parseFloat(searchParams.maxRate as string) : undefined
  const search = searchParams.search as string
  const lessonType = searchParams.lessonType as string

  // Build Supabase query - admins can see all tutors, others only approved and active
  let query = supabase
    .from('tutor_profiles')
    .select('*')
    .order('rating', { ascending: false })
  
  if (session?.user.role !== 'ADMIN') {
    query = query.eq('isApproved', true)
    // Filter out inactive tutors for non-admins (if isActive column exists)
    // Note: This will work even if isActive column doesn't exist yet (graceful degradation)
    query = query.eq('isActive', true)
  }
  
  if (minRate !== undefined) {
    query = query.gte('hourlyRate', minRate)
  }
  if (maxRate !== undefined) {
    query = query.lte('hourlyRate', maxRate)
  }
  
  const { data: tutorsData } = await query
  
  // Fetch related data for each tutor
  const tutors = await Promise.all(
    (tutorsData || []).map(async (tutor: any) => {
      // Fetch user
      const { data: user } = await supabase
        .from('users')
        .select('id, name, email, image')
        .eq('id', tutor.userId)
        .single()
      
      // Fetch reviews
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('tutorId', tutor.id)
      
      // Fetch bookings for lesson types
      const { data: bookings } = await supabase
        .from('bookings')
        .select('lessonType')
        .eq('tutorId', tutor.id)
      
      return {
        ...tutor,
        user: user || null,
        reviews: reviews || [],
        bookings: bookings || [],
      }
    })
  )

  // Filter by subject, grade, and search term (done in JavaScript for SQLite compatibility)
  let filteredTutors = tutors
  if (subject || grade || search) {
    filteredTutors = tutors.filter((tutor) => {
      const subjects = JSON.parse(tutor.subjects || '[]')
      const grades = JSON.parse(tutor.grades || '[]')
      
      // Filter by subject
      if (subject && !subjects.includes(subject)) {
        return false
      }
      
      // Filter by grade
      if (grade && !grades.includes(grade)) {
        return false
      }
      
      // Filter by search term
      if (search) {
        const searchLower = search.toLowerCase()
        const matchesSearch =
          tutor.user.name.toLowerCase().includes(searchLower) ||
          (tutor.bio && tutor.bio.toLowerCase().includes(searchLower)) ||
          subjects.some((s: string) => s.toLowerCase().includes(searchLower)) ||
          grades.some((g: string) => g.toLowerCase().includes(searchLower))
        
        if (!matchesSearch) {
          return false
        }
      }
      
      return true
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Tutors Dashboard
            {session?.user.role === 'ADMIN' && (
              <span className="ml-3 text-lg font-normal text-pink-600">(Admin View)</span>
            )}
          </h1>
          <p className="text-gray-600">
            {session?.user.role === 'ADMIN'
              ? 'Manage all registered tutors - approve, reject, or view their profiles'
              : 'Browse all registered tutors and find the perfect match for your learning needs. Filter by online or in-person lessons.'}
          </p>
        </div>
        <TutorDashboard
          tutors={filteredTutors}
          initialFilters={{ subject, grade, minRate, maxRate, search, lessonType }}
          isAdmin={session?.user.role === 'ADMIN'}
        />
      </div>
    </div>
  )
}

