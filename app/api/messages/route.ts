import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const messageSchema = z.object({
  recipientId: z.string(),
  content: z.string().min(1, 'Message cannot be empty'),
  bookingId: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = messageSchema.parse(body)

    // Verify users have a booking relationship
    const hasBooking = await prisma.booking.findFirst({
      where: {
        OR: [
          {
            studentId: session.user.id,
            tutor: {
              userId: validatedData.recipientId,
            },
          },
          {
            tutor: {
              userId: session.user.id,
            },
            studentId: validatedData.recipientId,
          },
        ],
      },
    })

    if (!hasBooking) {
      return NextResponse.json(
        { error: 'You can only message users you have bookings with' },
        { status: 403 }
      )
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        senderId: session.user.id,
        recipientId: validatedData.recipientId,
        content: validatedData.content,
        bookingId: validatedData.bookingId,
      },
      include: {
        sender: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    })

    return NextResponse.json(
      { message: 'Message sent successfully', data: message },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Message creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const recipientId = searchParams.get('recipientId')

    if (!recipientId) {
      return NextResponse.json(
        { error: 'recipientId is required' },
        { status: 400 }
      )
    }

    // Fetch messages between current user and recipient
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          {
            senderId: session.user.id,
            recipientId: recipientId,
          },
          {
            senderId: recipientId,
            recipientId: session.user.id,
          },
        ],
      },
      include: {
        sender: {
          select: {
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        senderId: recipientId,
        recipientId: session.user.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Message fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

