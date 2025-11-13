import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-db'

// Delete/Remove a tutor
export async function DELETE(
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

    // Check if tutor exists
    const { data: tutor } = await supabase
      .from('tutor_profiles')
      .select('id, userId')
      .eq('id', id)
      .single()

    if (!tutor) {
      return NextResponse.json(
        { error: 'Tutor not found' },
        { status: 404 }
      )
    }

    // Check if tutor has active bookings
    const { data: activeBookings } = await supabase
      .from('bookings')
      .select('id')
      .eq('tutorId', id)
      .in('status', ['PENDING', 'CONFIRMED'])
      .limit(1)

    if (activeBookings && activeBookings.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete tutor with active bookings. Please cancel or complete all bookings first.',
          hasActiveBookings: true
        },
        { status: 400 }
      )
    }

    // Delete tutor profile (this will cascade delete related records due to foreign key constraints)
    // Note: The user account will remain, but the tutor profile will be deleted
    // If you want to delete the user account too, uncomment the user deletion below
    
    const { error: deleteError } = await supabase
      .from('tutor_profiles')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting tutor:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete tutor' },
        { status: 500 }
      )
    }

    // Optional: Also delete the user account
    // Uncomment if you want to delete the user account as well
    /*
    const { error: userDeleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', tutor.userId)

    if (userDeleteError) {
      console.error('Error deleting user:', userDeleteError)
      // Don't fail if user deletion fails, tutor profile is already deleted
    }
    */

    return NextResponse.json(
      { message: 'Tutor removed successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Tutor deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

