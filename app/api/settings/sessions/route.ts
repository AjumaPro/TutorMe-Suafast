import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // In a real application, you would fetch active sessions from the database
    // For now, we'll return mock data
    const sessions = [
      {
        id: 'current',
        device: 'Desktop',
        browser: 'Chrome on macOS',
        location: 'San Francisco, CA',
        ipAddress: '192.168.1.1',
        lastActive: new Date().toISOString(),
        isCurrent: true,
      },
    ]

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error('Sessions fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { sessionId } = body

    // In a real application, you would invalidate the session in the database
    console.log(`User ${session.user.id} signed out from session ${sessionId}`)

    return NextResponse.json({
      message: 'Session signed out successfully',
    })
  } catch (error) {
    console.error('Session sign out error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

