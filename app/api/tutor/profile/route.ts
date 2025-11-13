import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-db'
import { z } from 'zod'
import crypto from 'crypto'

function uuidv4() {
  return crypto.randomUUID()
}

const profileSchema = z.object({
  bio: z.string().min(1, 'Bio is required'),
  subjects: z.array(z.string()).min(1, 'Select at least one subject'),
  grades: z.array(z.string()).min(1, 'Select at least one grade level'),
  experience: z.number().min(0).optional(),
  hourlyRate: z.number().min(0, 'Hourly rate must be positive'),
  credentials: z.string().url().optional().or(z.literal('')),
  lessonCategories: z.array(z.string()).min(1, 'Select at least one lesson category'),
  address: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(1, 'Zip code is required'),
  country: z.string().default('USA'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TUTOR') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = profileSchema.parse(body)

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('tutor_profiles')
      .select('id')
      .eq('userId', session.user.id)
      .single()
    
    const now = new Date().toISOString()
    const profileData: any = {
      bio: validatedData.bio,
      subjects: JSON.stringify(validatedData.subjects),
      grades: JSON.stringify(validatedData.grades),
      lessonCategories: JSON.stringify(validatedData.lessonCategories),
      experience: validatedData.experience || null,
      hourlyRate: validatedData.hourlyRate,
      credentials: validatedData.credentials || null,
      address: validatedData.address,
      city: validatedData.city,
      state: validatedData.state,
      zipCode: validatedData.zipCode,
      country: validatedData.country || 'USA',
      latitude: validatedData.latitude || null,
      longitude: validatedData.longitude || null,
      updatedAt: now,
    }
    
    let tutorProfile
    if (existingProfile) {
      // Update existing profile
      const { data, error } = await supabase
        .from('tutor_profiles')
        .update(profileData)
        .eq('id', existingProfile.id)
        .select()
        .single()
      
      if (error) throw error
      tutorProfile = data
    } else {
      // Create new profile
      const profileId = uuidv4()
      const { data, error } = await supabase
        .from('tutor_profiles')
        .insert({
          id: profileId,
          userId: session.user.id,
          ...profileData,
          isApproved: false,
          createdAt: now,
        })
        .select()
        .single()
      
      if (error) throw error
      tutorProfile = data
    }

    return NextResponse.json(
      { message: 'Profile updated successfully', tutorProfile },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

