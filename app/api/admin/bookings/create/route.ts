import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-db'
import { parseCurrencyCode, DEFAULT_CURRENCY } from '@/lib/currency'
import { calculatePrice } from '@/lib/pricing'
import { z } from 'zod'
import crypto from 'crypto'

function uuidv4() {
  return crypto.randomUUID()
}

const adminBookingSchema = z.object({
  tutorId: z.string(),
  studentId: z.string().optional(), // Optional for group classes
  studentIds: z.array(z.string()).optional(), // For group classes with multiple students
  subject: z.string(),
  lessonType: z.enum(['IN_PERSON', 'ONLINE']),
  scheduledAt: z.string().datetime(),
  duration: z.number().min(30).max(180),
  price: z.number().min(0),
  notes: z.string().optional(),
  isGroupClass: z.boolean().optional().default(false),
  maxParticipants: z.number().min(2).max(20).optional().default(10),
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

    // Verify student(s) exist(s) - either single student or multiple for group class
    const studentIds = validatedData.isGroupClass && validatedData.studentIds
      ? validatedData.studentIds
      : validatedData.studentId
        ? [validatedData.studentId]
        : []

    if (studentIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one student is required' },
        { status: 400 }
      )
    }

    // Verify all students exist
    const { data: students } = await supabase
      .from('users')
      .select('id, role')
      .in('id', studentIds)

    if (!students || students.length !== studentIds.length) {
      return NextResponse.json(
        { error: 'One or more students not found' },
        { status: 404 }
      )
    }

    // Verify all students are PARENT role
    const invalidStudents = students.filter(s => s.role !== 'PARENT')
    if (invalidStudents.length > 0) {
      return NextResponse.json(
        { error: 'One or more students have invalid role' },
        { status: 400 }
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

    // Calculate price using admin pricing rules if not provided
    let bookingPrice = validatedData.price
    if (!bookingPrice) {
      bookingPrice = await calculatePrice(validatedData.duration, validatedData.lessonType)
    }

    const now = new Date().toISOString()
    const isGroupClass = validatedData.isGroupClass || false
    const maxParticipants = validatedData.maxParticipants || 10

    // For group classes, create a parent booking and child bookings for each student
    if (isGroupClass && studentIds.length > 1) {
      // Create parent group class booking
      const parentBookingId = uuidv4()
      const parentBookingData: any = {
        id: parentBookingId,
        tutorId: validatedData.tutorId,
        subject: validatedData.subject,
        lessonType: validatedData.lessonType,
        scheduledAt: scheduledAt.toISOString(),
        duration: validatedData.duration,
        price: bookingPrice,
        currency: currency,
        status: 'PENDING', // Tutors need to accept
        isGroupClass: true,
        groupClassId: parentBookingId, // Points to itself
        maxParticipants: maxParticipants,
        createdAt: now,
        updatedAt: now,
      }

      if (validatedData.notes && validatedData.notes.trim()) {
        parentBookingData.notes = validatedData.notes.trim()
      }

      // Insert parent booking
      const { data: parentBooking, error: parentError } = await supabase
        .from('bookings')
        .insert(parentBookingData)
        .select()
        .single()

      if (parentError) {
        console.error('Error creating parent booking:', parentError)
        return NextResponse.json(
          { 
            error: 'Failed to create group class',
            details: process.env.NODE_ENV === 'development' ? parentError.message : undefined
          },
          { status: 500 }
        )
      }

      // Create child bookings for each student
      const childBookings = studentIds.map((studentId) => ({
        id: uuidv4(),
        studentId: studentId,
        tutorId: validatedData.tutorId,
        subject: validatedData.subject,
        lessonType: validatedData.lessonType,
        scheduledAt: scheduledAt.toISOString(),
        duration: validatedData.duration,
        price: bookingPrice,
        currency: currency,
        status: 'PENDING',
        isGroupClass: true,
        groupClassId: parentBookingId,
        maxParticipants: maxParticipants,
        createdAt: now,
        updatedAt: now,
        ...(validatedData.notes && validatedData.notes.trim() ? { notes: validatedData.notes.trim() } : {}),
      }))

      const { data: createdBookings, error: childrenError } = await supabase
        .from('bookings')
        .insert(childBookings)
        .select()

      if (childrenError) {
        console.error('Error creating child bookings:', childrenError)
        // Try to clean up parent booking
        await supabase.from('bookings').delete().eq('id', parentBookingId)
        return NextResponse.json(
          { 
            error: 'Failed to create student bookings',
            details: process.env.NODE_ENV === 'development' ? childrenError.message : undefined
          },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { 
          message: 'Group class created successfully',
          booking: parentBooking,
          childBookings: createdBookings || []
        },
        { status: 201 }
      )
    } else {
      // Single student booking (regular or group class with one student)
      const bookingId = uuidv4()
      const bookingData: any = {
        id: bookingId,
        studentId: studentIds[0],
        tutorId: validatedData.tutorId,
        subject: validatedData.subject,
        lessonType: validatedData.lessonType,
        scheduledAt: scheduledAt.toISOString(),
        duration: validatedData.duration,
        price: bookingPrice,
        currency: currency,
        status: 'PENDING', // Tutors need to accept
        createdAt: now,
        updatedAt: now,
      }

      if (isGroupClass) {
        bookingData.isGroupClass = true
        bookingData.groupClassId = bookingId
        bookingData.maxParticipants = maxParticipants
      }

      if (validatedData.notes && validatedData.notes.trim()) {
        bookingData.notes = validatedData.notes.trim()
      }

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
    }
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

