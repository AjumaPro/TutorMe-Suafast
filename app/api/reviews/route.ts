import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-db'
import { z } from 'zod'
import crypto from 'crypto'

function uuidv4() {
  return crypto.randomUUID()
}

const reviewSchema = z.object({
  bookingId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'PARENT') {
      return NextResponse.json(
        { error: 'Unauthorized - Only parents can leave reviews' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = reviewSchema.parse(body)

    // Verify booking exists and belongs to the student
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
    
    // Fetch tutor
    let tutor = null
    if (booking.tutorId) {
      const { data: tutorData } = await supabase
        .from('tutor_profiles')
        .select('*')
        .eq('id', booking.tutorId)
        .single()
      tutor = tutorData
    }
    
    // Fetch existing review
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('*')
      .eq('bookingId', validatedData.bookingId)
      .single()
    
    booking.tutor = tutor
    booking.review = existingReview || null

    if (booking.studentId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - This booking does not belong to you' },
        { status: 403 }
      )
    }

    if (booking.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'You can only review completed lessons' },
        { status: 400 }
      )
    }

    if (booking.review) {
      return NextResponse.json(
        { error: 'You have already reviewed this lesson' },
        { status: 400 }
      )
    }

    // Create review
    const reviewId = uuidv4()
    const now = new Date().toISOString()
    
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .insert({
        id: reviewId,
        bookingId: validatedData.bookingId,
        studentId: session.user.id,
        tutorId: booking.tutorId,
        rating: validatedData.rating,
        comment: validatedData.comment || null,
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single()
    
    if (reviewError) throw reviewError
    
    // Fetch student data
    const { data: student } = await supabase
      .from('users')
      .select('name, image')
      .eq('id', session.user.id)
      .single()
    
    review.student = student || null

    // Update tutor rating
    const { data: tutorReviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('tutorId', booking.tutorId)

    const averageRating = tutorReviews && tutorReviews.length > 0
      ? tutorReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / tutorReviews.length
      : 0

    await supabase
      .from('tutor_profiles')
      .update({
        rating: averageRating,
        totalReviews: tutorReviews?.length || 0,
        updatedAt: now,
      })
      .eq('id', booking.tutorId)

    return NextResponse.json(
      { message: 'Review submitted successfully', review },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Review creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tutorId = searchParams.get('tutorId')
    const bookingId = searchParams.get('bookingId')

    if (!tutorId && !bookingId) {
      return NextResponse.json(
        { error: 'Either tutorId or bookingId is required' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('reviews')
      .select('*')
      .order('createdAt', { ascending: false })
    
    if (tutorId) query = query.eq('tutorId', tutorId)
    if (bookingId) query = query.eq('bookingId', bookingId)

    const { data: reviewsData } = await query
    const reviews = reviewsData || []
    
    // Fetch related student and booking data
    for (const review of reviews) {
      if (review.studentId) {
        const { data: student } = await supabase
          .from('users')
          .select('name, image')
          .eq('id', review.studentId)
          .single()
        review.student = student || null
      }
      
      if (review.bookingId) {
        const { data: booking } = await supabase
          .from('bookings')
          .select('subject, scheduledAt')
          .eq('id', review.bookingId)
          .single()
        review.booking = booking || null
      }
    }

    return NextResponse.json({ reviews })
  } catch (error) {
    console.error('Review fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

