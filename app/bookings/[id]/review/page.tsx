import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase-db'
import ReviewForm from '@/components/ReviewForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function ReviewPage({
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
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Booking Not Found</h1>
            <p className="text-gray-600 mb-6">The booking you&apos;re looking for doesn&apos;t exist.</p>
            <Link
              href="/lessons"
              className="inline-block px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium"
            >
              Go to Lessons
            </Link>
          </div>
        </div>
      </div>
    )
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
  if (bookingData.studentId) {
    const { data: studentData } = await supabase
      .from('users')
      .select('name')
      .eq('id', bookingData.studentId)
      .single()
    student = studentData
  }

  // Fetch review
  const { data: review } = await supabase
    .from('reviews')
    .select('*')
    .eq('bookingId', bookingData.id)
    .single()

  // Combine all data
  const booking: any = {
    ...bookingData,
    tutor: tutor ? {
      ...tutor,
      user: tutorUser,
    } : null,
    student: student,
    review: review || null,
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Booking Not Found</h1>
            <p className="text-gray-600 mb-6">The booking you&apos;re looking for doesn&apos;t exist.</p>
            <Link
              href="/lessons"
              className="inline-block px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium"
            >
              Go to Lessons
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (booking.studentId !== session.user.id) {
    redirect('/lessons')
  }

  if (booking.status !== 'COMPLETED') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Cannot Review</h1>
            <p className="text-gray-600 mb-6">
              You can only review completed lessons.
            </p>
            <Link
              href="/lessons"
              className="inline-block px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium"
            >
              Go to Lessons
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (booking.review) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Already Reviewed</h1>
            <p className="text-gray-600 mb-6">
              You have already submitted a review for this lesson.
            </p>
            <Link
              href="/lessons"
              className="inline-block px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium"
            >
              Go to Lessons
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/lessons"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Lessons
        </Link>

        <div className="bg-white rounded-xl shadow-md p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Leave a Review</h1>
            <p className="text-gray-600">
              Share your experience with {booking.tutor.user.name} for your {booking.subject} lesson
            </p>
          </div>

          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Lesson Details</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Subject:</strong> {booking.subject}</p>
              <p><strong>Date:</strong> {new Date(booking.scheduledAt).toLocaleDateString()}</p>
              <p><strong>Duration:</strong> {booking.duration} minutes</p>
            </div>
          </div>

          <ReviewForm
            bookingId={booking.id}
            tutorName={booking.tutor.user.name}
            onSuccess={() => {
              window.location.href = '/lessons'
            }}
          />
        </div>
      </div>
    </div>
  )
}

