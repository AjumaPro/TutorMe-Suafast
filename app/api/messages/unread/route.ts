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
    const recipientId = searchParams.get('recipientId')

    if (!recipientId) {
      return NextResponse.json(
        { error: 'recipientId is required' },
        { status: 400 }
      )
    }

    // Count unread messages from this recipient
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('senderId', recipientId)
      .eq('recipientId', session.user.id)
      .eq('isRead', false)

    return NextResponse.json({ count })
  } catch (error) {
    console.error('Unread count error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

