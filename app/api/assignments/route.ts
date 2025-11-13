import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-db'
import { z } from 'zod'
import crypto from 'crypto'

function uuidv4() {
  return crypto.randomUUID()
}

const assignmentSchema = z.object({
  bookingId: z.string(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
})

const reviewAssignmentSchema = z.object({
  assignmentId: z.string(),
  feedback: z.string().optional(),
  grade: z.string().optional(),
  status: z.enum(['REVIEWED', 'COMPLETED']),
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
    const validatedData = assignmentSchema.parse(body)

    // Verify booking exists and belongs to student
    const { data: booking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', validatedData.bookingId)
      .single()

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    if (booking.studentId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only submit assignments for your own bookings' },
        { status: 403 }
      )
    }

    // Fetch tutor data
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

    const now = new Date().toISOString()
    const { data: assignment, error: createError } = await supabase
      .from('assignments')
      .insert({
        id: uuidv4(),
        bookingId: validatedData.bookingId,
        studentId: session.user.id,
        tutorId: booking.tutorId,
        title: validatedData.title,
        description: validatedData.description,
        fileUrl: validatedData.fileUrl,
        fileName: validatedData.fileName,
        fileSize: validatedData.fileSize,
        status: 'SUBMITTED',
        submittedAt: now,
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single()

    if (createError) throw createError

    // Attach booking and tutor data
    assignment.booking = {
      ...booking,
      tutor: tutor ? {
        ...tutor,
        user: tutorUser,
      } : null,
    }

    // Create notification for tutor
    if (tutorUser?.id) {
      const { createNotification } = await import('@/lib/notifications')
      await createNotification({
        userId: tutorUser.id,
        type: 'ASSIGNMENT_SUBMITTED',
        title: 'New Assignment Submitted',
        message: `${session.user.name} submitted an assignment: ${validatedData.title}`,
        link: `/assignments/${assignment.id}`,
      })
    }

    return NextResponse.json(
      { message: 'Assignment submitted successfully', assignment },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Assignment submission error:', error)
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
    const bookingId = searchParams.get('bookingId')
    const status = searchParams.get('status')

    let query = supabase
      .from('assignments')
      .select('*')

    if (session.user.role === 'PARENT') {
      query = query.eq('studentId', session.user.id)
    } else if (session.user.role === 'TUTOR') {
      const { data: tutorProfile } = await supabase
        .from('tutor_profiles')
        .select('id')
        .eq('userId', session.user.id)
        .single()
      
      if (tutorProfile) {
        query = query.eq('tutorId', tutorProfile.id)
      } else {
        return NextResponse.json({ assignments: [] })
      }
    }

    if (bookingId) {
      query = query.eq('bookingId', bookingId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: assignmentsData } = await query.order('createdAt', { ascending: false })
    const assignments = assignmentsData || []

    // Fetch related booking, tutor, and student data
    for (const assignment of assignments) {
      if (assignment.bookingId) {
        const { data: bookingData } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', assignment.bookingId)
          .single()
        
        if (bookingData) {
          // Fetch tutor
          let tutor = null
          let tutorUser = null
          if (bookingData.tutorId) {
            const { data: tutorData } = await supabase
              .from('tutor_profiles')
              .select('*')
              .eq('id', bookingData.tutorId)
              .single()
            
            tutor = tutorData
            
            if (tutor?.userId) {
              const { data: userData } = await supabase
                .from('users')
                .select('name')
                .eq('id', tutor.userId)
                .single()
              tutorUser = userData
            }
          }

          // Fetch student
          let student = null
          if (bookingData.studentId) {
            const { data: studentData } = await supabase
              .from('users')
              .select('name')
              .eq('id', bookingData.studentId)
              .single()
            student = studentData
          }

          assignment.booking = {
            ...bookingData,
            tutor: tutor ? {
              ...tutor,
              user: tutorUser,
            } : null,
            student: student,
          }
        }
      }
    }

    return NextResponse.json({ assignments })
  } catch (error) {
    console.error('Assignments fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TUTOR') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = reviewAssignmentSchema.parse(body)

    const { data: tutorProfile } = await supabase
      .from('tutor_profiles')
      .select('*')
      .eq('userId', session.user.id)
      .single()

    if (!tutorProfile) {
      return NextResponse.json(
        { error: 'Tutor profile not found' },
        { status: 404 }
      )
    }

    const { data: assignment } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', validatedData.assignmentId)
      .single()

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    if (assignment.tutorId !== tutorProfile.id) {
      return NextResponse.json(
        { error: 'You can only review assignments for your own students' },
        { status: 403 }
      )
    }

    // Fetch student data
    let student = null
    if (assignment.studentId) {
      const { data: studentData } = await supabase
        .from('users')
        .select('*')
        .eq('id', assignment.studentId)
        .single()
      student = studentData
    }

    const { data: updatedAssignment, error: updateError } = await supabase
      .from('assignments')
      .update({
        feedback: validatedData.feedback,
        grade: validatedData.grade,
        status: validatedData.status,
        reviewedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .eq('id', validatedData.assignmentId)
      .select()
      .single()

    if (updateError) throw updateError

    // Attach student data
    updatedAssignment.student = student

    // Create notification for student
    const { createNotification } = await import('@/lib/notifications')
    await createNotification({
      userId: assignment.studentId,
      type: 'ASSIGNMENT_REVIEWED',
      title: 'Assignment Reviewed',
      message: `Your assignment "${assignment.title}" has been reviewed`,
      link: `/assignments/${assignment.id}`,
    })

    return NextResponse.json({
      message: 'Assignment reviewed successfully',
      assignment: updatedAssignment,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Assignment review error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

