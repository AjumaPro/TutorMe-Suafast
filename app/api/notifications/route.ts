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
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined

    // Build query
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('userId', session.user.id)
    
    if (unreadOnly) {
      query = query.eq('isRead', false)
    }
    
    query = query.order('createdAt', { ascending: false })
    
    if (limit) {
      query = query.limit(limit)
    }
    
    const { data: notifications } = await query

    // Get unread count
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('userId', session.user.id)
      .eq('isRead', false)

    return NextResponse.json({
      notifications,
      unreadCount,
    })
  } catch (error) {
    console.error('Notifications fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { notificationId, markAllAsRead } = body

    if (markAllAsRead) {
      await supabase
        .from('notifications')
        .update({ isRead: true })
        .eq('userId', session.user.id)
        .eq('isRead', false)

      return NextResponse.json({ message: 'All notifications marked as read' })
    }

    if (notificationId) {
      await supabase
        .from('notifications')
        .update({ isRead: true })
        .eq('id', notificationId)

      return NextResponse.json({ message: 'Notification marked as read' })
    }

    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Notification update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

