import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-db'

// Remove student/tutor from a class (cancel booking)
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

    // Get the booking
    const { data: booking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single()

    if (!booking) {
      return NextResponse.json(
        { error: 'Class assignment not found' },
        { status: 404 }
      )
    }

    // Cancel the booking
    await supabase
      .from('bookings')
      .update({
        status: 'CANCELLED',
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id)

    return NextResponse.json({
      message: 'Student/tutor removed from class successfully',
    })
  } catch (error) {
    console.error('Remove assignment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

