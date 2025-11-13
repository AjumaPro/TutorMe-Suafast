import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase-db'
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
  
  // Fetch tutor profile
  const { data: tutorProfile } = await supabase
    .from('tutor_profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (!tutorProfile || !tutorProfile.isApproved) {
    redirect('/search')
  }

  // Fetch tutor user data
  let tutorUser = null
  if (tutorProfile.userId) {
    const { data: userData } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', tutorProfile.userId)
      .single()
    tutorUser = userData
  }

  const tutor = {
    ...tutorProfile,
    user: tutorUser,
  }

  // Fetch student addresses
  const { data: studentAddressesData } = await supabase
    .from('addresses')
    .select('*')
    .eq('userId', session.user.id)

  const studentAddresses = studentAddressesData || []

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

