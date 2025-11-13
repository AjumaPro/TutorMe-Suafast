import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-db'
import { z } from 'zod'
import crypto from 'crypto'

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
    // Check if user is student and recipient is tutor
    const { data: bookings1 } = await supabase
      .from('bookings')
      .select('*')
      .eq('studentId', session.user.id)
    
    // Check if user is tutor and recipient is student
    const { data: tutorProfile } = await supabase
      .from('tutor_profiles')
      .select('*')
      .eq('userId', session.user.id)
      .single()
    
    let bookings2: any[] = []
    if (tutorProfile) {
      const { data: tutorBookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('tutorId', tutorProfile.id)
      bookings2 = tutorBookings || []
    }
    
    // Check if any booking connects the two users
    const hasBooking = (bookings1 || []).some((b: any) => {
      if (b.tutorId) {
        // Check if recipient is the tutor for this booking
        return b.tutorId && tutorProfile && b.tutorId === tutorProfile.id
      }
      return false
    }) || bookings2.some((b: any) => b.studentId === validatedData.recipientId)

    if (!hasBooking) {
      return NextResponse.json(
        { error: 'You can only message users you have bookings with' },
        { status: 403 }
      )
    }

    // Create message
    const messageId = crypto.randomUUID()
    const messageData = {
      id: messageId,
      senderId: session.user.id,
      recipientId: validatedData.recipientId,
      content: validatedData.content,
      bookingId: validatedData.bookingId || null,
      isRead: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single()
    
    if (messageError || !message) {
      console.error('Error creating message:', messageError)
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      )
    }
    
    // Fetch sender info
    const { data: sender } = await supabase
      .from('users')
      .select('name, image')
      .eq('id', session.user.id)
      .single()
    
    const messageWithSender = {
      ...message,
      sender: sender ? {
        name: sender.name,
        image: sender.image,
      } : null,
    }

    return NextResponse.json(
      { message: 'Message sent successfully', data: messageWithSender },
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
    const { data: messages1 } = await supabase
      .from('messages')
      .select('*')
      .eq('senderId', session.user.id)
      .eq('recipientId', recipientId)
      .order('createdAt', { ascending: true })
    
    const { data: messages2 } = await supabase
      .from('messages')
      .select('*')
      .eq('senderId', recipientId)
      .eq('recipientId', session.user.id)
      .order('createdAt', { ascending: true })
    
    const allMessages = [...(messages1 || []), ...(messages2 || [])].sort((a: any, b: any) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
    
    // Fetch sender info for each message
    const messagesWithSenders = await Promise.all(
      allMessages.map(async (msg: any) => {
        const { data: sender } = await supabase
          .from('users')
          .select('name, image')
          .eq('id', msg.senderId)
          .single()
        
        return {
          ...msg,
          sender: sender ? {
            name: sender.name,
            image: sender.image,
          } : null,
        }
      })
    )

    // Mark messages as read
    const unreadMessages = (messages2 || []).filter((m: any) => !m.isRead)
    for (const msg of unreadMessages) {
      await supabase
        .from('messages')
        .update({
          isRead: true,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', msg.id)
    }

    return NextResponse.json({ messages: messagesWithSenders })
  } catch (error) {
    console.error('Message fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

