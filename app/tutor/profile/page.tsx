import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase-db'
import TutorProfileForm from '@/components/TutorProfileForm'
import AvailabilityCalendar from '@/components/AvailabilityCalendar'

export default async function TutorProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'TUTOR') {
    redirect('/auth/signin')
  }

  // Fetch tutor profile
  const { data: tutorProfileData } = await supabase
    .from('tutor_profiles')
    .select('*')
    .eq('userId', session.user.id)
    .single()

  let tutorProfile = tutorProfileData || null

  // Fetch user data
  if (tutorProfile?.userId) {
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', tutorProfile.userId)
      .single()
    tutorProfile.user = userData || null
  }

  // Fetch availability slots
  if (tutorProfile?.id) {
    const { data: availabilitySlots } = await supabase
      .from('availability_slots')
      .select('*')
      .eq('tutorId', tutorProfile.id)
    tutorProfile.availabilitySlots = availabilitySlots || []
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tutor Profile Management</h1>
          <p className="text-gray-600">
            Update your profile information, set your availability, and manage your tutoring schedule
          </p>
        </div>

        {/* Profile Status Banner */}
        {tutorProfile && (
          <div className={`mb-6 rounded-lg p-4 ${
            tutorProfile.isApproved 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {tutorProfile.isApproved ? (
                  <>
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-900">Profile Approved</h3>
                      <p className="text-sm text-green-700">Your profile is visible to students and ready for bookings</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                      <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-yellow-900">Pending Approval</h3>
                      <p className="text-sm text-yellow-700">Your profile is under review. You&apos;ll be notified once approved.</p>
                    </div>
                  </>
                )}
              </div>
              {tutorProfile.rating > 0 && (
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{tutorProfile.rating.toFixed(1)}</div>
                  <div className="text-sm text-gray-600">{tutorProfile.totalReviews} reviews</div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Profile Form and Availability */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-md p-8">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile Information</h2>
                <p className="text-sm text-gray-600">Update your bio, subjects, rates, and other profile details</p>
              </div>
              <TutorProfileForm tutorProfile={tutorProfile} />
            </div>

            <div className="bg-white rounded-xl shadow-md p-8">
              <AvailabilityCalendar />
            </div>

            <div className="bg-white rounded-xl shadow-md p-8">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Pricing Management</h2>
                <p className="text-sm text-gray-600">Set your custom prices for academic and professional courses</p>
              </div>
              <a
                href="/tutor/pricing"
                className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium"
              >
                Manage Pricing
              </a>
            </div>
          </div>

          {/* Sidebar - Quick Stats and Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Summary */}
            {tutorProfile && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Summary</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Hourly Rate</p>
                    <p className="text-2xl font-bold text-pink-600">₵{tutorProfile.hourlyRate.toFixed(2)}</p>
                  </div>
                  {tutorProfile.experience && (
                    <div>
                      <p className="text-sm text-gray-500">Experience</p>
                      <p className="text-lg font-semibold text-gray-900">{tutorProfile.experience} years</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">Subjects</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {JSON.parse(tutorProfile.subjects || '[]').slice(0, 3).map((subject: string) => (
                        <span
                          key={subject}
                          className="px-2 py-1 bg-pink-100 text-pink-700 text-xs rounded-full font-medium"
                        >
                          {subject}
                        </span>
                      ))}
                      {JSON.parse(tutorProfile.subjects || '[]').length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">
                          +{JSON.parse(tutorProfile.subjects || '[]').length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Grade Levels</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {JSON.parse(tutorProfile.grades || '[]').map((grade: string) => (
                        <span
                          key={grade}
                          className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium"
                        >
                          {grade}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 Tips</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Keep your availability updated to get more bookings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>A complete profile with bio and subjects helps students find you</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Set competitive rates based on your experience and subject expertise</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Use quick setup buttons to set availability for multiple days at once</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

