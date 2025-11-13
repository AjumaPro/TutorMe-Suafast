import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase-db'
import PaymentForm from '@/components/PaymentForm'

export default async function PaymentPage({
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
  const { data: booking } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', id)
    .single()

  if (!booking) {
    redirect('/dashboard')
  }

  // Fetch tutor and user data
  let tutor = null
  let tutorUser = null
  if (booking.tutorId) {
    const { data: tutorData } = await supabase
      .from('tutor_profiles')
      .select('*')
      .eq('id', booking.tutorId)
      .single()
    
    tutor = tutorData
    
    if (tutor?.userId) {
      const { data: userData } = await supabase
        .from('users')
        .select('name')
        .eq('id', tutor.userId)
        .single()
      tutorUser = userData
    }
  }

  // Fetch student data
  let student = null
  if (booking.studentId) {
    const { data: studentData } = await supabase
      .from('users')
      .select('email, name')
      .eq('id', booking.studentId)
      .single()
    student = studentData
  }

  // Fetch payment
  const { data: payment } = await supabase
    .from('payments')
    .select('*')
    .eq('bookingId', booking.id)
    .single()

  // Fetch child bookings for recurring bookings
  let childBookings: any[] = []
  if (booking.isRecurring && !booking.parentBookingId) {
    const { data: childBookingsData } = await supabase
      .from('bookings')
      .select('id, price, scheduledAt')
      .eq('parentBookingId', booking.id)
    
    childBookings = childBookingsData || []
  }

  // Combine all data
  const bookingWithRelations: any = {
    ...booking,
    tutor: tutor ? {
      ...tutor,
      user: tutorUser,
    } : null,
    student: student,
    payment: payment || null,
    childBookings: childBookings,
  }

  if (!bookingWithRelations || bookingWithRelations.studentId !== session.user.id) {
    redirect('/dashboard')
  }

  if (bookingWithRelations.status !== 'PENDING' || bookingWithRelations.payment?.status === 'PAID') {
    redirect(`/bookings/${bookingWithRelations.id}`)
  }

  // Log recurring booking info for debugging
  if (bookingWithRelations.isRecurring) {
    console.log('Recurring booking payment page:', {
      bookingId: bookingWithRelations.id,
      isParent: !bookingWithRelations.parentBookingId,
      hasChildBookings: bookingWithRelations.childBookings?.length || 0,
      price: bookingWithRelations.price,
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Complete Payment</h1>
        <PaymentForm booking={bookingWithRelations} />
      </div>
    </div>
  )
}

