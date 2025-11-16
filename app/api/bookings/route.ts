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

const bookingSchema = z.object({
  tutorId: z.string(),
  subject: z.string(),
  lessonType: z.enum(['IN_PERSON', 'ONLINE']),
  scheduledAt: z.string().datetime(),
  duration: z.number().min(30).max(180),
  price: z.number().min(0),
  paymentFrequency: z.enum(['HOURLY', 'WEEKLY', 'MONTHLY', 'YEARLY']).optional().default('HOURLY'),
  addressId: z.string().optional(),
  notes: z.string().optional(),
  isGroupClass: z.boolean().optional().default(false),
  maxParticipants: z.number().min(2).max(10).optional().default(10),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'PARENT') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = bookingSchema.parse(body)

    // Verify tutor exists and is approved
    const { data: tutor } = await supabase
      .from('tutor_profiles')
      .select('*')
      .eq('id', validatedData.tutorId)
      .single()

    if (!tutor || !tutor.isApproved) {
      return NextResponse.json(
        { error: 'Tutor not found or not approved' },
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
        studentId: session.user.id,
        tutorId: validatedData.tutorId,
        subject: validatedData.subject,
        lessonType: validatedData.lessonType,
        scheduledAt: scheduledAt,
        duration: validatedData.duration,
        price: validatedData.price,
        paymentFrequency: validatedData.paymentFrequency || 'HOURLY',
        currency: currency, // Will be handled gracefully if column doesn't exist
        status: 'PENDING',
      isGroupClass: validatedData.isGroupClass || false,
      maxParticipants: validatedData.maxParticipants || 10,
      groupClassId: null, // Will be updated if it's a group class
    }

    // Only add optional fields if they have values
    if (validatedData.addressId) {
      bookingData.addressId = validatedData.addressId
    }
    if (validatedData.notes && validatedData.notes.trim()) {
      bookingData.notes = validatedData.notes.trim()
    }

    // Convert dates to ISO strings for Supabase
    const bookingDataForSupabase: any = {
      ...bookingData,
      scheduledAt: scheduledAt.toISOString(),
      createdAt: now,
      updatedAt: now,
    }
    
    // Try to insert with currency, if it fails, try without
    let booking: any = null
    let bookingError: any = null
    
    const { data: insertedBooking, error: error1 } = await supabase
      .from('bookings')
      .insert(bookingDataForSupabase)
      .select()
      .single()
    
    if (error1 && error1.code === 'PGRST204' && error1.message?.includes('currency')) {
      // Currency column doesn't exist, try without it
      console.warn('Currency column not found, creating booking without currency field')
      delete bookingDataForSupabase.currency
      
      const { data: insertedBooking2, error: error2 } = await supabase
        .from('bookings')
        .insert(bookingDataForSupabase)
        .select()
        .single()
      
      booking = insertedBooking2
      bookingError = error2
    } else {
      booking = insertedBooking
      bookingError = error1
    }
    
    if (bookingError) throw bookingError

    // If it's a group class, update the groupClassId to point to itself
    if (validatedData.isGroupClass && booking) {
      await supabase
        .from('bookings')
        .update({ groupClassId: booking.id })
        .eq('id', booking.id)
    }

    // Send notifications to both student and tutor about new booking
    try {
      const { createNotification } = await import('@/lib/notifications')
      const { 
        sendBookingNotificationEmail, 
        sendStudentBookingConfirmationEmail 
      } = await import('@/lib/email')
      
      // Fetch tutor user data
      if (tutor?.userId) {
        const { data: tutorUser } = await supabase
          .from('users')
          .select('*')
          .eq('id', tutor.userId)
          .single()
        
        // Fetch student data
        const { data: studentData } = await supabase
          .from('users')
          .select('name, email')
          .eq('id', session.user.id)
          .single()
        
        if (tutorUser && studentData) {
          const scheduledAt = new Date(validatedData.scheduledAt)
          
          // Create in-app notification for tutor
          await createNotification({
            userId: tutor.userId,
            type: 'BOOKING_CREATED',
            title: 'New Booking Request',
            message: `${studentData.name || 'A student'} has requested a ${validatedData.subject} lesson scheduled for ${scheduledAt.toLocaleDateString()} at ${scheduledAt.toLocaleTimeString()}.`,
            link: `/bookings/${booking.id}`,
            metadata: {
              bookingId: booking.id,
              studentName: studentData.name || 'Unknown',
              studentEmail: studentData.email || 'Unknown',
              subject: validatedData.subject,
              scheduledAt: scheduledAt.toISOString(),
              lessonType: validatedData.lessonType,
            },
          })

          // Send email notification to tutor
          if (tutorUser.email) {
            await sendBookingNotificationEmail(
              tutorUser.email,
              tutorUser.name || 'Tutor',
              studentData.name || 'A student',
              {
                id: booking.id,
                subject: validatedData.subject,
                scheduledAt: scheduledAt.toISOString(),
                duration: validatedData.duration,
                lessonType: validatedData.lessonType,
                price: booking.price || 0,
                currency: booking.currency || 'GHS',
              }
            )
          }

          // Create in-app notification for student
          await createNotification({
            userId: session.user.id,
            type: 'BOOKING_CREATED',
            title: 'Booking Request Sent',
            message: `Your ${validatedData.subject} lesson request with ${tutorUser.name || 'Tutor'} has been sent. Waiting for confirmation.`,
            link: `/bookings/${booking.id}`,
            metadata: {
              bookingId: booking.id,
              tutorName: tutorUser.name || 'Tutor',
              subject: validatedData.subject,
              scheduledAt: scheduledAt.toISOString(),
              lessonType: validatedData.lessonType,
            },
          })

          // Send email notification to student
          if (studentData.email) {
            await sendStudentBookingConfirmationEmail(
              studentData.email,
              studentData.name || 'Student',
              tutorUser.name || 'Tutor',
              {
                id: booking.id,
                subject: validatedData.subject,
                scheduledAt: scheduledAt.toISOString(),
                duration: validatedData.duration,
                lessonType: validatedData.lessonType,
                price: booking.price || 0,
                currency: booking.currency || 'GHS',
              }
            )
          }
        }
      }
    } catch (notificationError) {
      console.error('Error sending notifications:', notificationError)
      // Don't fail the booking creation if notification fails
    }

    return NextResponse.json(
      { message: 'Booking created successfully', booking },
      { status: 201 }
    )
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    
    // Extract error message from various error types
    let errorMessage = 'Unknown error'
    let errorDetails: any = null
    
    if (error instanceof Error) {
      errorMessage = error.message
      errorDetails = {
        name: error.name,
        stack: error.stack,
      }
    } else if (error?.message) {
      errorMessage = error.message
      errorDetails = error
    } else if (typeof error === 'string') {
      errorMessage = error
    } else if (error) {
      // Try to stringify the error
      try {
        errorMessage = JSON.stringify(error)
        errorDetails = error
      } catch {
        errorMessage = String(error)
      }
    }
    
    // Check for Supabase-specific errors
    if (error?.code) {
      errorDetails = {
        code: error.code,
        message: error.message || errorMessage,
        details: error.details,
        hint: error.hint,
      }
      
      // Provide user-friendly messages for common Supabase errors
      if (error.code === 'PGRST204') {
        errorMessage = `Database column not found: ${error.message || 'The requested column does not exist in the database'}`
      } else if (error.code === '23505') {
        errorMessage = 'A record with this information already exists'
      } else if (error.code === '23503') {
        errorMessage = 'Referenced record does not exist'
      } else if (error.code === '42P01') {
        errorMessage = 'Database table does not exist'
      }
    }
    
    console.error('Booking creation error:', errorMessage)
    console.error('Error details:', {
      message: errorMessage,
      error: errorDetails || error,
      fullError: error,
    })
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const tutorId = searchParams.get('tutorId')
    const bookingId = searchParams.get('id')

    // If bookingId is provided, return single booking
    if (bookingId) {
      if (!session) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }

      const { data: booking } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single()

      if (!booking) {
        return NextResponse.json(
          { error: 'Booking not found' },
          { status: 404 }
        )
      }

      // Check authorization
      if (session.user.role === 'PARENT' && booking.studentId !== session.user.id) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        )
      }

      if (session.user.role === 'TUTOR') {
        const { data: tutorProfile } = await supabase
          .from('tutor_profiles')
          .select('id')
          .eq('userId', session.user.id)
          .single()

        if (!tutorProfile || booking.tutorId !== tutorProfile.id) {
          return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 403 }
          )
        }
      }

      // Fetch related data
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
            .select('*')
            .eq('id', tutor.userId)
            .single()
          tutorUser = userData
        }
      }

      let student = null
      let studentAddress = null
      if (booking.studentId) {
        const { data: studentData } = await supabase
          .from('users')
          .select('*')
          .eq('id', booking.studentId)
          .single()
        student = studentData
        
        // Fetch student address if it's an in-person lesson
        // Only include address for booking partners (tutor viewing their student)
        if (booking.lessonType === 'IN_PERSON' && booking.addressId) {
          const isBookingPartner = session.user.role === 'TUTOR' && booking.tutorId
          if (isBookingPartner || session.user.role === 'ADMIN' || booking.studentId === session.user.id) {
            const { data: address } = await supabase
              .from('addresses')
              .select('*')
              .eq('id', booking.addressId)
              .single()
            studentAddress = address
          }
        }
      }

      const { data: payment } = await supabase
        .from('payments')
        .select('*')
        .eq('bookingId', booking.id)
        .single()

      const { data: review } = await supabase
        .from('reviews')
        .select('*')
        .eq('bookingId', booking.id)
        .single()

      // Import security utilities
      const { sanitizeUser, sanitizeTutorProfile, removeSensitiveFields } = await import('@/lib/security')

      // Determine context for data sanitization
      const isTutorSelf = tutor?.userId === session.user.id
      const isStudentSelf = booking.studentId === session.user.id
      const isBookingPartner = 
        (session.user.role === 'TUTOR' && booking.tutorId) ||
        (session.user.role === 'PARENT' && booking.studentId === session.user.id)

      // Sanitize tutor data
      const sanitizedTutor = tutor ? {
        ...sanitizeTutorProfile(tutor, isTutorSelf ? 'self' : 'public'),
        user: tutorUser ? sanitizeUser(
          tutorUser,
          isTutorSelf ? 'self' : session.user.role === 'ADMIN' ? 'admin' : 'public',
          isTutorSelf || session.user.role === 'ADMIN', // Email only for self/admin
          false // Don't include phone for tutors
        ) : null,
      } : null

      // Sanitize student data
      const sanitizedStudent = student ? sanitizeUser(
        student,
        isStudentSelf ? 'self' : isBookingPartner ? 'booking_partner' : 'public',
        isStudentSelf || session.user.role === 'ADMIN', // Email only for self/admin
        isBookingPartner || session.user.role === 'ADMIN' // Phone for booking partners/admin
      ) : null

      const bookingWithRelations = {
        ...booking,
        tutor: sanitizedTutor,
        student: sanitizedStudent,
        studentAddress: studentAddress, // Already filtered above
        payment: payment ? removeSensitiveFields(payment) : null,
        review: review || null,
      }

      return NextResponse.json({ booking: bookingWithRelations })
    }

    // Allow public access if tutorId is provided (for availability checking)
    if (tutorId) {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('tutorId', tutorId)
        .neq('status', 'CANCELLED')
        .order('scheduledAt', { ascending: true })

      // Map to response format
      const filteredBookings = (bookings || []).map((b: any) => ({
        id: b.id,
        scheduledAt: b.scheduledAt,
        duration: b.duration,
        status: b.status,
      }))

      return NextResponse.json({ bookings: filteredBookings })
    }

    // Otherwise require authentication
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch bookings based on user role
    let bookings: any[] = []

    if (session.user.role === 'PARENT') {
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('*')
        .eq('studentId', session.user.id)
        .order('createdAt', { ascending: false })
      
      bookings = bookingsData || []
      
      // Import security utilities
      const { sanitizeUser, sanitizeTutorProfile } = await import('@/lib/security')

      // Fetch related data separately
      for (const booking of bookings) {
        if (booking.tutorId) {
          const { data: tutor } = await supabase
            .from('tutor_profiles')
            .select('*')
            .eq('id', booking.tutorId)
            .single()
          
          if (tutor) {
            const isTutorSelf = tutor.userId === session.user.id
            booking.tutor = sanitizeTutorProfile(tutor, isTutorSelf ? 'self' : 'public')
            if (tutor.userId) {
              const { data: tutorUser } = await supabase
                .from('users')
                .select('*')
                .eq('id', tutor.userId)
                .single()
              
              // Parents can see tutor name and image, but not email unless needed
              booking.tutor.user = tutorUser ? sanitizeUser(
                tutorUser,
                isTutorSelf ? 'self' : 'public',
                false, // Don't expose tutor email to students
                false  // Don't expose tutor phone
              ) : null
            }
          }
        }
        // Fetch payment and review
        const { data: payment } = await supabase
          .from('payments')
          .select('*')
          .eq('bookingId', booking.id)
          .single()
        
        const { data: review } = await supabase
          .from('reviews')
          .select('*')
          .eq('bookingId', booking.id)
          .single()
        
        booking.payment = payment || null
        booking.review = review || null
      }
    } else if (session.user.role === 'TUTOR') {
      const { data: tutorProfile } = await supabase
        .from('tutor_profiles')
        .select('*')
        .eq('userId', session.user.id)
        .single()

      if (tutorProfile) {
        const { data: bookingsData } = await supabase
          .from('bookings')
          .select('*')
          .eq('tutorId', tutorProfile.id)
          .order('createdAt', { ascending: false })
        
        bookings = bookingsData || []
        
        // Import security utilities
        const { sanitizeUser } = await import('@/lib/security')

        // Fetch related data separately
        for (const booking of bookings) {
          if (booking.studentId) {
            const { data: student } = await supabase
              .from('users')
              .select('*')
              .eq('id', booking.studentId)
              .single()
            
            // Tutors can see student email and phone for their bookings (booking partners)
            booking.student = student ? sanitizeUser(
              student,
              'booking_partner',
              true, // Include email for communication
              true  // Include phone for lesson coordination
            ) : null
            
            // Fetch student address if it's an in-person lesson
            if (booking.lessonType === 'IN_PERSON' && booking.addressId) {
              const { data: address } = await supabase
                .from('addresses')
                .select('*')
                .eq('id', booking.addressId)
                .single()
              booking.studentAddress = address || null
            }
          }
          // Fetch payment and review
          const { data: payment } = await supabase
            .from('payments')
            .select('*')
            .eq('bookingId', booking.id)
            .single()
          
          const { data: review } = await supabase
            .from('reviews')
            .select('*')
            .eq('bookingId', booking.id)
            .single()
          
          booking.payment = payment || null
          booking.review = review || null
        }
      }
    }

    return NextResponse.json({ bookings })
  } catch (error) {
    console.error('Booking fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

