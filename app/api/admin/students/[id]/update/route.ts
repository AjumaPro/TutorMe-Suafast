import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-db'
import { z } from 'zod'

const updateStudentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional().nullable(),
})

// Update student details (admin only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateStudentSchema.parse(body)

    // Check if student exists and is a PARENT role
    const { data: student } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .eq('role', 'PARENT')
      .single()

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Normalize email for comparison
    const normalizedStudentEmail = student.email?.toLowerCase().trim() || ''
    
    // If email is being updated, check if it's already taken
    if (validatedData.email) {
      const normalizedEmail = validatedData.email.toLowerCase().trim()
      
      // Only check for duplicates if the normalized email is different
      if (normalizedEmail !== normalizedStudentEmail) {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', normalizedEmail)
          .neq('id', id)
          .single()

        if (existingUser) {
          return NextResponse.json(
            { error: 'An account with this email already exists' },
            { status: 400 }
          )
        }
      }
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    }

    if (validatedData.name) {
      const trimmedName = validatedData.name.trim()
      if (trimmedName !== student.name?.trim()) {
        updateData.name = trimmedName
      }
    }

    if (validatedData.email) {
      const normalizedEmail = validatedData.email.toLowerCase().trim()
      // Only update if the normalized email is different
      if (normalizedEmail !== normalizedStudentEmail) {
        updateData.email = normalizedEmail
      }
    }

    if (validatedData.phone !== undefined) {
      const trimmedPhone = validatedData.phone?.trim() || null
      const currentPhone = student.phone?.trim() || null
      if (trimmedPhone !== currentPhone) {
        updateData.phone = trimmedPhone
      }
    }

    // Check if there are any actual changes (besides updatedAt)
    const hasChanges = Object.keys(updateData).filter(key => key !== 'updatedAt').length > 0

    if (!hasChanges) {
      return NextResponse.json(
        { 
          message: 'No changes detected',
          student: student 
        },
        { status: 200 }
      )
    }

    // Update student
    const { data: updatedStudent, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating student:', updateError)
      return NextResponse.json(
        { 
          error: updateError.message || 'Failed to update student',
          details: process.env.NODE_ENV === 'development' ? updateError : undefined
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        message: 'Student updated successfully', 
        student: updatedStudent 
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
    console.error('Student update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

