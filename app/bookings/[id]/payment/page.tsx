import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import { prisma } from '@/lib/prisma'
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
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      tutor: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
      student: {
        select: {
          email: true,
          name: true,
        },
      },
      payment: true,
      childBookings: {
        select: {
          id: true,
          price: true,
          scheduledAt: true,
        },
      },
    },
  })

  if (!booking || booking.studentId !== session.user.id) {
    redirect('/dashboard')
  }

  if (booking.status !== 'PENDING' || booking.payment?.status === 'PAID') {
    redirect(`/bookings/${booking.id}`)
  }

  // Log recurring booking info for debugging
  if (booking.isRecurring) {
    console.log('Recurring booking payment page:', {
      bookingId: booking.id,
      isParent: !booking.parentBookingId,
      hasChildBookings: booking.childBookings?.length || 0,
      price: booking.price,
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Complete Payment</h1>
        <PaymentForm booking={booking} />
      </div>
    </div>
  )
}

