import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-db'
import { createNotification } from '@/lib/notifications'
import { calculatePrice } from '@/lib/pricing'
import { getCourseType } from '@/lib/pricing-validation'
import { z } from 'zod'

function uuidv4() {
  return crypto.randomUUID()
}

const assignmentSchema = z.object({
  studentId: z.string(),
  tutorId: z.string(),
  subject: z.string().min(1),
  scheduledAt: z.string().datetime().optional(),
  duration: z.number().min(30).max(180).optional(),
  price: z.number().min(0).optional(),
})

// Create a class assignment (admin assigns student to tutor)
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
    const validatedData = assignmentSchema.parse(body)

    // Verify student exists
    const { data: student } = await supabase
      .from('users')
      .select('*')
      .eq('id', validatedData.studentId)
      .single()

    if (!student || student.role !== 'PARENT') {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

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

    // Fetch tutor user data
    let tutorUser = null
    if (tutor.userId) {
      const { data: userData } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('id', tutor.userId)
        .single()
      tutorUser = userData
    }

    // Create booking/assignment
    const scheduledAt = validatedData.scheduledAt
      ? new Date(validatedData.scheduledAt)
      : new Date(Date.now() + 24 * 60 * 60 * 1000) // Default to tomorrow

    const duration = validatedData.duration || 60
    const lessonType = 'ONLINE' // Admin assignments default to ONLINE
    const subject = validatedData.subject || ''
    
    // Determine course type
    const courseType = getCourseType(tutor, subject)
    
    // Calculate price using tutor pricing or admin pricing rules
    let calculatedPrice = validatedData.price
    if (!calculatedPrice) {
      calculatedPrice = await calculatePrice(duration, lessonType, tutor, courseType, subject)
    }

    const bookingId = uuidv4()
    const bookingData = {
      id: bookingId,
      studentId: validatedData.studentId,
      tutorId: validatedData.tutorId,
      subject: validatedData.subject,
      lessonType: lessonType,
      scheduledAt: scheduledAt.toISOString(),
      duration: duration,
      price: calculatedPrice,
      currency: tutor.currency || 'GHS',
      status: 'CONFIRMED', // Auto-confirm admin assignments
      notes: 'Assigned by administrator',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select()
      .single()

    if (bookingError || !booking) {
      console.error('Error creating booking:', bookingError)
      return NextResponse.json(
        { error: 'Failed to create booking' },
        { status: 500 }
      )
    }

    // Send notifications to both parent and tutor
    try {
      // Notification for parent (student)
      await createNotification({
        userId: validatedData.studentId,
        type: 'BOOKING_CONFIRMED',
        title: 'New Class Assigned',
        message: `You have been assigned to a ${validatedData.subject} lesson with ${tutor.user.name}. The lesson is scheduled for ${new Date(scheduledAt).toLocaleDateString()} at ${new Date(scheduledAt).toLocaleTimeString()}.`,
        link: `/bookings/${booking.id}`,
        metadata: {
          bookingId: booking.id,
          subject: validatedData.subject,
          scheduledAt: scheduledAt.toISOString(),
          tutorName: tutorUser?.name || 'Tutor',
        },
      })

      // Notification for tutor
      if (tutor.userId) {
        await createNotification({
          userId: tutor.userId,
          type: 'BOOKING_CONFIRMED',
          title: 'New Class Assignment',
          message: `You have been assigned to teach ${student.name} for a ${validatedData.subject} lesson scheduled for ${new Date(scheduledAt).toLocaleDateString()} at ${new Date(scheduledAt).toLocaleTimeString()}.`,
          link: `/bookings/${booking.id}`,
          metadata: {
            bookingId: booking.id,
            subject: validatedData.subject,
            scheduledAt: scheduledAt.toISOString(),
            studentName: student.name,
          },
        })
      }

      console.log(`✅ Notifications sent to parent (${student.email}) and tutor (${tutorUser?.email || 'N/A'})`)
    } catch (notificationError) {
      console.error('Error sending notifications:', notificationError)
      // Don't fail the assignment if notifications fail
    }

    return NextResponse.json(
      { message: 'Class assigned successfully', booking },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Class assignment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get all class assignments
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = supabase
      .from('bookings')
      .select('*')
      .order('scheduledAt', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status.toUpperCase())
    }

    const { data: bookingsData } = await query
    const bookings = bookingsData || []

    // Fetch related data
    const bookingsWithRelations = await Promise.all(
      bookings.map(async (booking) => {
        let student = null
        if (booking.studentId) {
          const { data: studentData } = await supabase
            .from('users')
            .select('name, email')
            .eq('id', booking.studentId)
            .single()
          student = studentData
        }

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
              .select('name, email')
              .eq('id', tutor.userId)
              .single()
            tutorUser = userData
          }
        }

        return {
          ...booking,
          student,
          tutor: tutor ? { ...tutor, user: tutorUser } : null,
        }
      })
    )

    return NextResponse.json({ assignments: bookingsWithRelations })
  } catch (error) {
    console.error('Get assignments error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

