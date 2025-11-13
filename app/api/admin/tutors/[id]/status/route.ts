import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-db'
import { z } from 'zod'

const statusSchema = z.object({
  isActive: z.boolean(),
})

// Toggle tutor active/inactive status
export async function POST(
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
    const { isActive } = statusSchema.parse(body)

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

    // Update tutor status - handle case where isActive column might not exist
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    }
    
    // Try to update isActive, but handle gracefully if column doesn't exist
    try {
      updateData.isActive = isActive
    } catch (e) {
      // Column might not exist, we'll handle it in the error
    }

    const { data: updatedTutor, error: updateError } = await supabase
      .from('tutor_profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating tutor status:', updateError)
      
      // Check if error is due to missing column
      if (updateError.code === '42703' || updateError.message?.includes('isActive') || updateError.message?.includes('column')) {
        return NextResponse.json(
          { 
            error: 'isActive column not found. Please run the database migration: supabase/add-isactive-to-tutors.sql',
            details: 'The isActive column needs to be added to the tutor_profiles table first.'
          },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { 
          error: updateError.message || 'Failed to update tutor status',
          details: process.env.NODE_ENV === 'development' ? updateError : undefined
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        message: `Tutor ${isActive ? 'activated' : 'deactivated'} successfully`, 
        tutor: updatedTutor 
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
    console.error('Tutor status update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

