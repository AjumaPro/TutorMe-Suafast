import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    // Fetch all user data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        tutorProfile: true,
        bookings: {
          include: {
            tutor: { include: { user: { select: { name: true, email: true } } } },
            payment: true,
            review: true,
          },
        },
        reviews: true,
        addresses: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prepare export data
    const exportData = {
      profile: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        createdAt: user.createdAt,
      },
      tutorProfile: user.tutorProfile,
      bookings: user.bookings,
      reviews: user.reviews,
      addresses: user.addresses,
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

