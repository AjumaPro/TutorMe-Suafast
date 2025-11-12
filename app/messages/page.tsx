import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import { prisma } from '@/lib/prisma'
import MessagesPageClient from '@/components/MessagesPageClient'

export default async function MessagesPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  // Fetch conversations based on user role
  let conversations: any[] = []

  if (session.user.role === 'PARENT') {
    const bookings = await prisma.booking.findMany({
      where: {
        studentId: session.user.id,
      },
      include: {
        tutor: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
      distinct: ['tutorId'],
    })

    conversations = bookings.map((booking) => ({
      id: booking.tutorId,
      userId: booking.tutor.userId,
      name: booking.tutor.user.name,
      email: booking.tutor.user.email,
      image: booking.tutor.user.image,
      role: 'Tutor',
    }))
  } else if (session.user.role === 'TUTOR') {
    const bookings = await prisma.booking.findMany({
      where: {
        tutor: {
          userId: session.user.id,
        },
      },
      include: {
        student: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
      },
      distinct: ['studentId'],
    })

    conversations = bookings.map((booking) => ({
      id: booking.studentId,
      userId: booking.studentId,
      name: booking.student.name,
      email: booking.student.email,
      image: booking.student.image,
      role: 'Student',
    }))
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

