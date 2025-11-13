import { redirect } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase-db'
import { formatCurrency, parseCurrencyCode } from '@/lib/currency'
import AssignmentUpload from '@/components/AssignmentUpload'
import ProgressEntryForm from '@/components/ProgressEntryForm'

// Dynamically import VideoClassroomWrapper to avoid webpack issues
const VideoClassroomWrapper = dynamic(() => import('@/components/VideoClassroomWrapper'), {
  ssr: false,
  loading: () => (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading video session...</p>
        </div>
      </div>
    </div>
  ),
})

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  const { id } = await params
  
  // Fetch booking
  const { data: bookingData } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', id)
    .single()
  
  if (!bookingData) {
    redirect('/dashboard')
  }
  
  // Fetch tutor and user data
  let tutor = null
  let tutorUser = null
  if (bookingData.tutorId) {
    const { data: tutorData } = await supabase
      .from('tutor_profiles')
      .select('*')
      .eq('id', bookingData.tutorId)
      .single()
    
    tutor = tutorData
    
    if (tutor?.userId) {
      const { data: userData } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', tutor.userId)
        .single()
      tutorUser = userData
    }
  }
  
  // Fetch student data
  let student = null
  let studentAddress = null
  if (bookingData.studentId) {
    const { data: studentData } = await supabase
      .from('users')
      .select('name, email, phone')
      .eq('id', bookingData.studentId)
      .single()
    student = studentData
    
    // Fetch student address if it's an in-person lesson
    if (bookingData.lessonType === 'IN_PERSON' && bookingData.addressId) {
      const { data: address } = await supabase
        .from('addresses')
        .select('*')
        .eq('id', bookingData.addressId)
        .single()
      studentAddress = address
    }
  }
  
  // Fetch video session
  const { data: videoSession } = await supabase
    .from('video_sessions')
    .select('sessionToken, status')
    .eq('bookingId', bookingData.id)
    .single()
  
  // Fetch assignments
  const { data: assignments } = await supabase
    .from('assignments')
    .select('*')
    .eq('bookingId', bookingData.id)
    .order('createdAt', { ascending: false })
  
  // Combine all data
  const bookingWithRelations: any = {
    ...bookingData,
    tutor: tutor ? {
      ...tutor,
      user: tutorUser,
    } : null,
    student: student,
    studentAddress: studentAddress,
    videoSession: videoSession ? {
      sessionToken: videoSession.sessionToken,
      status: videoSession.status,
    } : null,
    assignments: assignments || [],
  }
  
  // Use bookingWithRelations as the final booking object
  const booking = bookingWithRelations

  // Check if user is authorized (student or tutor)
  const isAuthorized =
    booking.studentId === session.user.id ||
    (tutor?.userId === session.user.id)

  if (!isAuthorized) {
    redirect('/dashboard')
  }

  // Allow access to view lesson details for any status
  // Users can view their own lessons regardless of status

  const otherPerson =
    session.user.role === 'PARENT' 
      ? (booking.tutor?.user || { name: 'Tutor' })
      : (booking.student || { name: 'Student' })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/lessons"
            className="text-pink-600 hover:text-pink-700 font-medium mb-4 inline-block"
          >
            ← Back to Lessons
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {booking.lessonType === 'ONLINE' ? 'Online Lesson' : 'Lesson Details'}
          </h1>
          <p className="text-gray-600">
            {booking.subject} with {otherPerson.name}
          </p>
        </div>

        {/* Lesson Info Card */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Tutor/Student</h3>
              <p className="text-lg font-semibold text-gray-800">{otherPerson.name}</p>
              <p className="text-sm text-gray-600">{otherPerson.email}</p>
              {/* Show student phone and location for tutors */}
              {session.user.role === 'TUTOR' && booking.student && (
                <div className="mt-2 space-y-1">
                  {booking.student.phone && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Phone:</span>{' '}
                      <a 
                        href={`tel:${booking.student.phone}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {booking.student.phone}
                      </a>
                    </p>
                  )}
                  {booking.lessonType === 'IN_PERSON' && booking.studentAddress && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Location:</span>{' '}
                      {booking.studentAddress.street}, {booking.studentAddress.city}, {booking.studentAddress.state} {booking.studentAddress.zipCode}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Subject</h3>
              <p className="text-lg font-semibold text-gray-800">{booking.subject}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Date & Time</h3>
              <p className="text-lg font-semibold text-gray-800">
                {new Date(booking.scheduledAt).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <p className="text-sm text-gray-600">
                {new Date(booking.scheduledAt).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                {' - '}
                {booking.duration} minutes
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Type</h3>
              <p className="text-lg font-semibold text-gray-800">
                {booking.lessonType === 'ONLINE' ? 'Online' : 'In-Person'}
              </p>
              {booking.lessonType === 'ONLINE' && booking.meetingUrl && (
                <a
                  href={booking.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-pink-600 hover:text-pink-700 mt-1 inline-block"
                >
                  Meeting Link →
                </a>
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  booking.status === 'CONFIRMED'
                    ? 'bg-green-100 text-green-800'
                    : booking.status === 'COMPLETED'
                    ? 'bg-blue-100 text-blue-800'
                    : booking.status === 'PENDING'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {booking.status}
              </span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Price</h3>
              <p className="text-lg font-semibold text-gray-800">
                {formatCurrency(booking.price, parseCurrencyCode(booking.currency))}
              </p>
            </div>
          </div>
          {booking.notes && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
              <p className="text-gray-700">{booking.notes}</p>
            </div>
          )}
        </div>

        {/* Video Classroom */}
        {booking.lessonType === 'ONLINE' && (booking.status === 'CONFIRMED' || booking.status === 'COMPLETED') && (
          <VideoClassroomWrapper 
            booking={booking} 
            userRole={session.user.role}
            sessionToken={booking.videoSession?.sessionToken}
          />
        )}

        {/* Assignments Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {session.user.role === 'PARENT' && (
            <AssignmentUpload
              bookingId={booking.id}
            />
          )}

          {session.user.role === 'TUTOR' && booking.status === 'COMPLETED' && (
            <ProgressEntryForm
              bookingId={booking.id}
              studentId={booking.studentId}
              tutorId={booking.tutorId}
              subject={booking.subject}
            />
          )}
        </div>

        {/* Assignments List */}
        {booking.assignments && booking.assignments.length > 0 && (
          <div className="mt-6 bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Assignments</h3>
            <div className="space-y-3">
              {booking.assignments.map((assignment: any) => (
                <div
                  key={assignment.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-800">{assignment.title}</h4>
                      {assignment.description && (
                        <p className="text-sm text-gray-600 mt-1">{assignment.description}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Submitted: {new Date(assignment.submittedAt).toLocaleDateString()}
                      </p>
                      {assignment.feedback && (
                        <div className="mt-2 p-2 bg-blue-50 rounded">
                          <p className="text-sm text-blue-800">{assignment.feedback}</p>
                        </div>
                      )}
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        assignment.status === 'SUBMITTED'
                          ? 'bg-yellow-100 text-yellow-800'
                          : assignment.status === 'REVIEWED'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {assignment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

