import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-db'
import { z } from 'zod'

const reassignSchema = z.object({
  tutorId: z.string().optional(),
  studentId: z.string().optional(),
  subject: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
  duration: z.number().min(30).max(180).optional(),
  price: z.number().min(0).optional(),
})

// Reassign student to different tutor or change class details
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = reassignSchema.parse(body)

    // Get the booking
    const { data: booking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single()

    if (!booking) {
      return NextResponse.json(
        { error: 'Class assignment not found' },
        { status: 404 }
      )
    }

    // Verify new tutor if provided
    if (validatedData.tutorId) {
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
    }

    // Verify new student if provided
    if (validatedData.studentId) {
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
    }

    // Update booking
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    }
    if (validatedData.tutorId) updateData.tutorId = validatedData.tutorId
    if (validatedData.studentId) updateData.studentId = validatedData.studentId
    if (validatedData.subject) updateData.subject = validatedData.subject
    if (validatedData.scheduledAt) updateData.scheduledAt = new Date(validatedData.scheduledAt).toISOString()
    if (validatedData.duration) updateData.duration = validatedData.duration
    if (validatedData.price) updateData.price = validatedData.price
    updateData.notes = booking.notes
      ? `${booking.notes} | Reassigned by administrator`
      : 'Reassigned by administrator'

    const { data: updatedBookingData } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (!updatedBookingData) {
      return NextResponse.json(
        { error: 'Failed to update booking' },
        { status: 500 }
      )
    }

    // Fetch related data
    let student = null
    if (updatedBookingData.studentId) {
      const { data: studentData } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', updatedBookingData.studentId)
        .single()
      student = studentData
    }

    let tutor = null
    let tutorUser = null
    if (updatedBookingData.tutorId) {
      const { data: tutorData } = await supabase
        .from('tutor_profiles')
        .select('*')
        .eq('id', updatedBookingData.tutorId)
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

    const updatedBooking = {
      ...updatedBookingData,
      student,
      tutor: tutor ? { ...tutor, user: tutorUser } : null,
    }

    return NextResponse.json({
      message: 'Class reassigned successfully',
      booking: updatedBooking,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Reassign error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

