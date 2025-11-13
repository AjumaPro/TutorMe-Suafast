import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase-db'
import TutorSearch from '@/components/TutorSearch'

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  const subject = searchParams.subject as string
  const grade = searchParams.grade as string
  const minRate = searchParams.minRate ? parseFloat(searchParams.minRate as string) : undefined
  const maxRate = searchParams.maxRate ? parseFloat(searchParams.maxRate as string) : undefined

  // Build Supabase query for approved and active tutors
  let query = supabase
    .from('tutor_profiles')
    .select('*')
    .eq('isApproved', true)
    .eq('isActive', true) // Only show active tutors
    .order('rating', { ascending: false })

  // Filter by hourly rate
  if (minRate !== undefined) {
    query = query.gte('hourlyRate', minRate)
  }
  if (maxRate !== undefined) {
    query = query.lte('hourlyRate', maxRate)
  }

  // Fetch all approved tutors
  const { data: tutorsData } = await query
  const allTutors = tutorsData || []

  // Fetch user data for each tutor
  for (const tutor of allTutors) {
    if (tutor.userId) {
      const { data: userData } = await supabase
        .from('users')
        .select('name, email, image')
        .eq('id', tutor.userId)
        .single()
      tutor.user = userData || null
    }
  }

  // Filter by subject and grade in JavaScript (since they're stored as JSON strings)
  let tutors = allTutors
  if (subject || grade) {
    tutors = allTutors.filter((tutor) => {
      // Parse subjects and grades from JSON strings
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
      
      return true
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Find a Tutor</h1>
          <p className="text-gray-600">Search for tutors by subject, grade level, and more</p>
        </div>
        <TutorSearch tutors={tutors} initialFilters={{ subject, grade, minRate, maxRate }} />
      </div>
    </div>
  )
}

