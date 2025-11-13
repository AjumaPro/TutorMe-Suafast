import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-db'
import { z } from 'zod'

const profileUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional().nullable(),
  bio: z.string().optional(),
  hourlyRate: z.number().min(0).optional(),
})

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()
    
    // Fetch tutor profile if user is a tutor
    let tutorProfile = null
    if (user?.role === 'TUTOR') {
      const { data: profile } = await supabase
        .from('tutor_profiles')
        .select('*')
        .eq('userId', user.id)
        .single()
      tutorProfile = profile
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user: { ...user, tutorProfile } })
  } catch (error) {
    console.error('Settings fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = profileUpdateSchema.parse(body)

    // Normalize email
    const email = validatedData.email.toLowerCase().trim()

    // Check if email is being changed and if it's already taken
    const { data: currentUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // If email is being changed, check if it's already taken by another user
    if (email !== currentUser.email) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      if (existingUser && existingUser.id !== session.user.id) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 400 }
        )
      }
    }

    // Update user profile
    const { data: updatedUser } = await supabase
      .from('users')
      .update({
        name: validatedData.name.trim(),
        email,
        phone: validatedData.phone?.trim() || null,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', session.user.id)
      .select()
      .single()

    // Fetch tutor profile
    let tutorProfile = null
    if (updatedUser?.role === 'TUTOR') {
      const { data: profile } = await supabase
        .from('tutor_profiles')
        .select('*')
        .eq('userId', updatedUser.id)
        .single()
      tutorProfile = profile
    }

    // Update tutor profile if user is a tutor and bio/hourlyRate are provided
    if (session.user.role === 'TUTOR' && (validatedData.bio !== undefined || validatedData.hourlyRate !== undefined)) {
      const existingProfile = await supabase
        .from('tutor_profiles')
        .select('*')
        .eq('userId', session.user.id)
        .single()
      
      const profileData: any = {}
      if (validatedData.bio !== undefined) profileData.bio = validatedData.bio
      if (validatedData.hourlyRate !== undefined) profileData.hourlyRate = validatedData.hourlyRate
      profileData.updatedAt = new Date().toISOString()
      
      if (existingProfile.data) {
        await supabase
          .from('tutor_profiles')
          .update(profileData)
          .eq('userId', session.user.id)
      } else {
        await supabase
          .from('tutor_profiles')
          .insert({
            ...profileData,
            userId: session.user.id,
            isApproved: false,
            rating: 0,
            totalReviews: 0,
            subjects: '[]',
            grades: '[]',
            createdAt: new Date().toISOString(),
          })
      }
      
      // Fetch updated tutor profile
      const { data: updatedProfile } = await supabase
        .from('tutor_profiles')
        .select('*')
        .eq('userId', session.user.id)
        .single()
      tutorProfile = updatedProfile
    }

    return NextResponse.json(
      { 
        message: 'Profile updated successfully',
        user: { ...updatedUser, tutorProfile }
      },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      )
    }

    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile. Please try again.' },
      { status: 500 }
    )
  }
}
