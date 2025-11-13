import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase-db'
import NotificationsList from '@/components/NotificationsList'

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  const { data: notificationsData } = await supabase
    .from('notifications')
    .select('*')
    .eq('userId', session.user.id)
    .order('createdAt', { ascending: false })
    .limit(50)

  // Convert Date objects to strings for the component
  const notifications = (notificationsData || []).map((n: any) => ({
    ...n,
    createdAt: typeof n.createdAt === 'string' ? n.createdAt : new Date(n.createdAt).toISOString(),
  }))

  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('userId', session.user.id)
    .eq('isRead', false)

  const unreadCountValue = unreadCount || 0

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
          <p className="text-gray-600">
            {unreadCountValue > 0
              ? `You have ${unreadCountValue} unread notification${unreadCountValue > 1 ? 's' : ''}`
              : 'All caught up!'}
          </p>
        </div>

        <NotificationsList initialNotifications={notifications} />
      </div>
    </div>
  )
}

