import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-db'
import { parseCurrencyCode, DEFAULT_CURRENCY } from '@/lib/currency'
import { z } from 'zod'

const priceSchema = z.object({
  hourlyRate: z.number().min(0),
  currency: z.string().optional(),
})

// Update tutor hourly rate and currency
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
    const { hourlyRate, currency } = priceSchema.parse(body)

    // Check if tutor exists
    const { data: tutor } = await supabase
      .from('tutor_profiles')
      .select('id')
      .eq('id', id)
      .single()

    if (!tutor) {
      return NextResponse.json(
        { error: 'Tutor not found' },
        { status: 404 }
      )
    }

    // Parse and validate currency
    const validCurrency = parseCurrencyCode(currency || DEFAULT_CURRENCY)

    // Update tutor price
    const updateData: any = {
      hourlyRate,
      updatedAt: new Date().toISOString(),
    }

    // Add currency if provided
    if (currency) {
      updateData.currency = validCurrency
    }

    const { data: updatedTutor, error: updateError } = await supabase
      .from('tutor_profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating tutor price:', updateError)
      return NextResponse.json(
        { 
          error: updateError.message || 'Failed to update tutor price',
          details: process.env.NODE_ENV === 'development' ? updateError : undefined
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        message: 'Tutor price updated successfully', 
        tutor: updatedTutor 
      },
      { status: 200 }
    )
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Tutor price update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
