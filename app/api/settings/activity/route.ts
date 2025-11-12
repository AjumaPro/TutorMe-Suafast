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

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    // In a real application, you would fetch activity logs from the database
    // For now, we'll return mock data
    const activities = [
      {
        id: '1',
        action: 'Login',
        description: 'Signed in successfully',
        timestamp: new Date().toISOString(),
        ipAddress: '192.168.1.1',
        location: 'San Francisco, CA',
        type: 'login',
      },
      {
        id: '2',
        action: 'Password Changed',
        description: 'Password was updated',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        ipAddress: '192.168.1.1',
        location: 'San Francisco, CA',
        type: 'security',
      },
    ]

    const filteredActivities = type && type !== 'all'
      ? activities.filter((a) => a.type === type)
      : activities

    return NextResponse.json({ activities: filteredActivities })
  } catch (error) {
    console.error('Activity fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

