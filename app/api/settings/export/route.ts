import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-db'

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
    const format = searchParams.get('format') || 'json'

    // Fetch user data
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Fetch tutor profile
    const { data: tutorProfile } = await supabase
      .from('tutor_profiles')
      .select('*')
      .eq('userId', session.user.id)
      .single()

    // Fetch bookings
    const { data: bookingsData } = await supabase
      .from('bookings')
      .select('*')
      .eq('studentId', session.user.id)

    const bookings = bookingsData || []
    const bookingsWithRelations = await Promise.all(
      bookings.map(async (booking) => {
        let tutor = null
        let tutorUser = null
        if (booking.tutorId) {
          const { data: tutorData } = await supabase
            .from('tutor_profiles')
            .select('*')
            .eq('id', booking.tutorId)
            .single()
          tutor = tutorData

          if (tutor?.userId) {
            const { data: userData } = await supabase
              .from('users')
              .select('*')
              .eq('id', tutor.userId)
              .single()
            // Only include tutor email in export if it's the user's own data
            tutorUser = userData ? {
              name: userData.name,
              email: userData.email, // Own export can include email
            } : null
          }
        }

        const { data: payment } = await supabase
          .from('payments')
          .select('*')
          .eq('bookingId', booking.id)
          .single()

        const { data: review } = await supabase
          .from('reviews')
          .select('*')
          .eq('bookingId', booking.id)
          .single()

        return {
          ...booking,
          tutor: tutor ? { ...tutor, user: tutorUser } : null,
          payment: payment || null,
          review: review || null,
        }
      })
    )

    // Fetch reviews
    const { data: reviews } = await supabase
      .from('reviews')
      .select('*')
      .eq('studentId', session.user.id)

    // Fetch addresses
    const { data: addresses } = await supabase
      .from('addresses')
      .select('*')
      .eq('userId', session.user.id)

    // Prepare export data
    const exportData = {
      profile: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        createdAt: user.createdAt,
      },
      tutorProfile: tutorProfile || null,
      bookings: bookingsWithRelations,
      reviews: reviews || [],
      addresses: addresses || [],
      exportDate: new Date().toISOString(),
    }

    if (format === 'csv') {
      // Convert to CSV (simplified)
      const csv = 'Name,Email,Phone\n' + `${user.name},${user.email},${user.phone || ''}`
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="tutorme-data-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }

    // Return JSON
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="tutorme-data-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  } catch (error) {
    console.error('Data export error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

