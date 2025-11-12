import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { payment: true },
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    if (booking.studentId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Update payment status
    if (booking.payment) {
      await prisma.payment.update({
        where: { id: booking.payment.id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
        },
      })
    }

    // Update booking status
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: 'CONFIRMED',
      },
    })

    // Create video session for online lessons
    if (booking.lessonType === 'ONLINE') {
      const { randomBytes } = await import('crypto')
      const sessionToken = randomBytes(32).toString('hex')
      
      await prisma.videoSession.upsert({
        where: { bookingId: booking.id },
        create: {
          bookingId: booking.id,
          sessionToken,
          status: 'ACTIVE',
        },
        update: {
          status: 'ACTIVE',
        },
      })
    }

    return NextResponse.json(
      { message: 'Booking confirmed successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Booking confirmation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

