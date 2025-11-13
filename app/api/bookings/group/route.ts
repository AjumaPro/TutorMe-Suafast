import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-db'
import { z } from 'zod'

function uuidv4() {
  return crypto.randomUUID()
}

const joinGroupClassSchema = z.object({
  groupClassId: z.string(),
})

// Get available group classes for a tutor
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tutorId = searchParams.get('tutorId')
    const subject = searchParams.get('subject')
    const scheduledAt = searchParams.get('scheduledAt')

    if (!tutorId) {
      return NextResponse.json(
        { error: 'Tutor ID is required' },
        { status: 400 }
      )
    }

    // Find group classes for this tutor
    let query = supabase
      .from('bookings')
      .select('*')
      .eq('tutorId', tutorId)
      .eq('isGroupClass', true)
      .neq('status', 'CANCELLED')
      .gte('scheduledAt', new Date().toISOString())
      .order('scheduledAt', { ascending: true })

    if (subject) {
      query = query.eq('subject', subject)
    }

    if (scheduledAt) {
      const targetDate = new Date(scheduledAt)
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0))
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999))
      query = query.gte('scheduledAt', startOfDay.toISOString())
      query = query.lte('scheduledAt', endOfDay.toISOString())
    }

    const { data: allGroupBookingsData } = await query
    const allGroupBookings = allGroupBookingsData || []

    // Fetch related data
    const allGroupBookingsWithRelations = await Promise.all(
      allGroupBookings.map(async (booking) => {
        let student = null
        if (booking.studentId) {
          const { data: studentData } = await supabase
            .from('users')
            .select('name, email, image')
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
              .select('name, email, image')
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

    // Filter to get only parent group classes (where groupClassId equals id or is null)
    const parentGroupClasses = allGroupBookingsWithRelations.filter(
      (booking) => booking.groupClassId === booking.id || booking.groupClassId === null
    )

    // For each group class, count current participants
    const groupClassesWithCount = await Promise.all(
      parentGroupClasses.map(async (groupClass) => {
        // Count bookings that are either the parent or joined this group
        const { count: participantCount } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .or(`id.eq.${groupClass.id},groupClassId.eq.${groupClass.id}`)
          .neq('status', 'CANCELLED')

        return {
          ...groupClass,
          currentParticipants: participantCount || 0,
          availableSpots: (groupClass.maxParticipants || 0) - (participantCount || 0),
        }
      })
    )

    // Filter out full classes
    const availableGroupClasses = groupClassesWithCount.filter(
      (gc) => gc.availableSpots > 0
    )

    return NextResponse.json({ groupClasses: availableGroupClasses })
  } catch (error) {
    console.error('Error fetching group classes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Join an existing group class
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
    const validatedData = joinGroupClassSchema.parse(body)

    // Get the parent group class
    const { data: parentGroupClass } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', validatedData.groupClassId)
      .single()

    if (!parentGroupClass || !parentGroupClass.isGroupClass) {
      return NextResponse.json(
        { error: 'Group class not found' },
        { status: 404 }
      )
    }

    // Fetch tutor data
    let tutor = null
    if (parentGroupClass.tutorId) {
      const { data: tutorData } = await supabase
        .from('tutor_profiles')
        .select('*')
        .eq('id', parentGroupClass.tutorId)
        .single()
      tutor = tutorData
    }

    // Check if class is full
    const { count: participantCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .or(`id.eq.${parentGroupClass.id},groupClassId.eq.${parentGroupClass.id}`)
      .neq('status', 'CANCELLED')

    if ((participantCount || 0) >= (parentGroupClass.maxParticipants || 0)) {
      return NextResponse.json(
        { error: 'Group class is full' },
        { status: 400 }
      )
    }

    // Check if user already joined this group class
    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('*')
      .eq('studentId', session.user.id)
      .or(`id.eq.${parentGroupClass.id},groupClassId.eq.${parentGroupClass.id}`)
      .neq('status', 'CANCELLED')

    if (existingBookings && existingBookings.length > 0) {
      return NextResponse.json(
        { error: 'You have already joined this group class' },
        { status: 400 }
      )
    }

    // Create a booking that joins the group class
    const bookingId = uuidv4()
    const bookingData = {
      id: bookingId,
      studentId: session.user.id,
      tutorId: parentGroupClass.tutorId,
      subject: parentGroupClass.subject,
      lessonType: parentGroupClass.lessonType,
      scheduledAt: parentGroupClass.scheduledAt,
      duration: parentGroupClass.duration,
      price: parentGroupClass.price,
      currency: parentGroupClass.currency || 'GHS',
      addressId: parentGroupClass.addressId,
      notes: parentGroupClass.notes,
      status: 'PENDING',
      isGroupClass: true,
      groupClassId: parentGroupClass.id,
      maxParticipants: parentGroupClass.maxParticipants,
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
        { error: 'Failed to join group class' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Successfully joined group class', booking },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error joining group class:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

