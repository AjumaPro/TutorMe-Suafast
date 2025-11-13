import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-db'
import { parseCurrencyCode, DEFAULT_CURRENCY } from '@/lib/currency'
import { z } from 'zod'
import crypto from 'crypto'

function uuidv4() {
  return crypto.randomUUID()
}

const adminBookingSchema = z.object({
  tutorId: z.string(),
  studentId: z.string(),
  subject: z.string(),
  lessonType: z.enum(['IN_PERSON', 'ONLINE']),
  scheduledAt: z.string().datetime(),
  duration: z.number().min(30).max(180),
  price: z.number().min(0),
  notes: z.string().optional(),
})

// Admin can create bookings for any tutor and student
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = adminBookingSchema.parse(body)

    // Verify tutor exists
    const { data: tutor } = await supabase
      .from('tutor_profiles')
      .select('*')
      .eq('id', validatedData.tutorId)
      .single()

    if (!tutor) {
      return NextResponse.json(
        { error: 'Tutor not found' },
        { status: 404 }
      )
    }

    // Verify student exists
    const { data: student } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', validatedData.studentId)
      .single()

    if (!student || student.role !== 'PARENT') {
      return NextResponse.json(
        { error: 'Student not found or invalid' },
        { status: 404 }
      )
    }

    // Verify scheduled time is in the future
    const scheduledAt = new Date(validatedData.scheduledAt)
    if (scheduledAt <= new Date()) {
      return NextResponse.json(
        { error: 'Scheduled time must be in the future' },
        { status: 400 }
      )
    }

    // Get currency from tutor profile (default to GHS)
    const currency = parseCurrencyCode(tutor.currency || DEFAULT_CURRENCY)

    // Generate UUID for booking ID
    const bookingId = uuidv4()
    const now = new Date().toISOString()

    // Create booking
    const bookingData: any = {
      id: bookingId,
      studentId: validatedData.studentId,
      tutorId: validatedData.tutorId,
      subject: validatedData.subject,
      lessonType: validatedData.lessonType,
      scheduledAt: scheduledAt.toISOString(),
      duration: validatedData.duration,
      price: validatedData.price,
      currency: currency,
      status: 'CONFIRMED', // Admin-created bookings are automatically confirmed
      createdAt: now,
      updatedAt: now,
    }

    // Add optional notes
    if (validatedData.notes && validatedData.notes.trim()) {
      bookingData.notes = validatedData.notes.trim()
    }

    // Insert booking
    const { data: booking, error: insertError } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select()
      .single()

    if (insertError) {
      console.error('Error creating booking:', insertError)
      return NextResponse.json(
        { 
          error: 'Failed to create booking',
          details: process.env.NODE_ENV === 'development' ? insertError.message : undefined
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        message: 'Booking created successfully',
        booking 
      },
      { status: 201 }
    )
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Admin booking creation error:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}

