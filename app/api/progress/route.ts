import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-db'
import { z } from 'zod'
import crypto from 'crypto'

function uuidv4() {
  return crypto.randomUUID()
}

const progressEntrySchema = z.object({
  studentId: z.string(),
  tutorId: z.string().optional(),
  bookingId: z.string().optional(),
  subject: z.string().min(1, 'Subject is required'),
  topic: z.string().optional(),
  score: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  milestone: z.string().optional(),
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
    const validatedData = progressEntrySchema.parse(body)

    // Verify student belongs to tutor or is the student themselves
    if (session.user.role === 'TUTOR') {
      const { data: tutorProfile } = await supabase
        .from('tutor_profiles')
        .select('*')
        .eq('userId', session.user.id)
        .single()

      if (!tutorProfile || validatedData.tutorId !== tutorProfile.id) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        )
      }

      // Verify booking belongs to tutor if provided
      if (validatedData.bookingId) {
        const { data: booking } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', validatedData.bookingId)
          .single()

        if (!booking || booking.tutorId !== tutorProfile.id) {
          return NextResponse.json(
            { error: 'Invalid booking' },
            { status: 400 }
          )
        }
      }
    } else if (session.user.role === 'PARENT') {
      if (validatedData.studentId !== session.user.id) {
        return NextResponse.json(
          { error: 'You can only add progress for yourself' },
          { status: 403 }
        )
      }
    }

    const now = new Date().toISOString()
    const { data: progressEntry, error: createError } = await supabase
      .from('progress_entries')
      .insert({
        id: uuidv4(),
        studentId: validatedData.studentId,
        tutorId: validatedData.tutorId,
        bookingId: validatedData.bookingId,
        subject: validatedData.subject,
        topic: validatedData.topic,
        score: validatedData.score,
        notes: validatedData.notes,
        milestone: validatedData.milestone,
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single()

    if (createError) throw createError

    // Fetch student data
    if (progressEntry.studentId) {
      const { data: student } = await supabase
        .from('users')
        .select('name')
        .eq('id', progressEntry.studentId)
        .single()
      progressEntry.student = student || null
    }

    // Create notification for student
    if (session.user.role === 'TUTOR') {
      const { createNotification } = await import('@/lib/notifications')
      await createNotification({
        userId: validatedData.studentId,
        type: 'PROGRESS_UPDATED',
        title: 'Progress Updated',
        message: `Your progress in ${validatedData.subject} has been updated`,
        link: `/progress`,
      })
    }

    return NextResponse.json(
      { message: 'Progress entry created successfully', progressEntry },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Progress entry creation error:', error)
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
    const studentId = searchParams.get('studentId')
    const subject = searchParams.get('subject')

    let query = supabase
      .from('progress_entries')
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
        return NextResponse.json({ progressEntries: [] })
      }
    }

    if (studentId) {
      query = query.eq('studentId', studentId)
    }

    if (subject) {
      query = query.eq('subject', subject)
    }

    const { data: progressEntriesData } = await query.order('createdAt', { ascending: false })
    const progressEntries = progressEntriesData || []

    // Fetch student data for each entry
    for (const entry of progressEntries) {
      if (entry.studentId) {
        const { data: student } = await supabase
          .from('users')
          .select('name')
          .eq('id', entry.studentId)
          .single()
        entry.student = student || null
      }
    }

    // Calculate statistics
    const stats = {
      totalEntries: progressEntries.length,
      averageScore: progressEntries.length > 0
        ? progressEntries
            .filter((e) => e.score !== null)
            .reduce((sum, e) => sum + (e.score || 0), 0) /
          progressEntries.filter((e) => e.score !== null).length
        : 0,
      subjects: Array.from(
        new Set(progressEntries.map((e) => e.subject))
      ),
      milestones: progressEntries.filter((e) => e.milestone !== null).length,
    }

    return NextResponse.json({
      progressEntries,
      stats,
    })
  } catch (error) {
    console.error('Progress fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

