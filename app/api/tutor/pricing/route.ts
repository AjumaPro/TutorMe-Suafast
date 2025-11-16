import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-db'
import { validateTutorPricing, PRICING_LIMITS } from '@/lib/pricing-validation'
import { z } from 'zod'

const pricingSchema = z.object({
  academicInPersonPricePerTwoHours: z.number().min(0).max(PRICING_LIMITS.academicInPersonMax).optional(),
  academicOnlinePricePerTwoHours: z.number().min(0).max(PRICING_LIMITS.academicOnlineMax).optional(),
  professionalPricePerHour: z.number().min(PRICING_LIMITS.professionalMin).max(PRICING_LIMITS.professionalMax).optional(),
})

// Get tutor pricing
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'TUTOR' && session.user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized. Tutor or Admin access required.' },
        { status: 401 }
      )
    }

    // Get tutor profile
    const { data: tutor, error } = await supabase
      .from('tutor_profiles')
      .select('id, academicInPersonPricePerTwoHours, academicOnlinePricePerTwoHours, professionalPricePerHour, subjects, lessonCategories')
      .eq('userId', session.user.id)
      .single()

    if (error || !tutor) {
      return NextResponse.json(
        { error: 'Tutor profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        pricing: {
          academicInPersonPricePerTwoHours: tutor.academicInPersonPricePerTwoHours || null,
          academicOnlinePricePerTwoHours: tutor.academicOnlinePricePerTwoHours || null,
          professionalPricePerHour: tutor.professionalPricePerHour || null,
        },
        limits: PRICING_LIMITS,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Pricing fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update tutor pricing
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'TUTOR' && session.user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized. Tutor or Admin access required.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = pricingSchema.parse(body)

    // Additional validation
    const validation = validateTutorPricing(validatedData)
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', errors: validation.errors },
        { status: 400 }
      )
    }

    // Get tutor profile
    const { data: tutor, error: fetchError } = await supabase
      .from('tutor_profiles')
      .select('id')
      .eq('userId', session.user.id)
      .single()

    if (fetchError || !tutor) {
      return NextResponse.json(
        { error: 'Tutor profile not found' },
        { status: 404 }
      )
    }

    // Prepare update data (only include fields that are provided)
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    }

    if (validatedData.academicInPersonPricePerTwoHours !== undefined) {
      updateData.academicInPersonPricePerTwoHours = validatedData.academicInPersonPricePerTwoHours
    }
    if (validatedData.academicOnlinePricePerTwoHours !== undefined) {
      updateData.academicOnlinePricePerTwoHours = validatedData.academicOnlinePricePerTwoHours
    }
    if (validatedData.professionalPricePerHour !== undefined) {
      updateData.professionalPricePerHour = validatedData.professionalPricePerHour
    }

    // Update tutor pricing
    const { data: updatedTutor, error: updateError } = await supabase
      .from('tutor_profiles')
      .update(updateData)
      .eq('id', tutor.id)
      .select('academicInPersonPricePerTwoHours, academicOnlinePricePerTwoHours, professionalPricePerHour')
      .single()

    if (updateError) {
      console.error('Error updating tutor pricing:', updateError)
      return NextResponse.json(
        { error: 'Failed to update pricing' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message: 'Pricing updated successfully',
        pricing: {
          academicInPersonPricePerTwoHours: updatedTutor.academicInPersonPricePerTwoHours,
          academicOnlinePricePerTwoHours: updatedTutor.academicOnlinePricePerTwoHours,
          professionalPricePerHour: updatedTutor.professionalPricePerHour,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Pricing update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

