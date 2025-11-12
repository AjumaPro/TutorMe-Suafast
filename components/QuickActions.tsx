'use client'

import { Search, Calendar, BookOpen, MessageSquare, Settings, CreditCard, Video, Users } from 'lucide-react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

export default function QuickActions() {
  const { data: session } = useSession()
  const isTutor = session?.user?.role === 'TUTOR'
  const isParent = session?.user?.role === 'PARENT'

  const actions = [
    {
      icon: <Search className="h-5 w-5" />,
      label: isParent ? 'Find Tutor' : 'Browse Students',
      href: isParent ? '/search' : '/tutors',
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      icon: <Calendar className="h-5 w-5" />,
      label: 'Book Lesson',
      href: isParent ? '/search' : '/lessons',
      color: 'bg-pink-500 hover:bg-pink-600',
    },
    {
      icon: <BookOpen className="h-5 w-5" />,
      label: 'My Bookings',
      href: '/bookings',
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      icon: <MessageSquare className="h-5 w-5" />,
      label: 'Messages',
      href: '/messages',
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      icon: <Video className="h-5 w-5" />,
      label: 'Video Sessions',
      href: '/lessons',
      color: 'bg-indigo-500 hover:bg-indigo-600',
    },
    {
      icon: <CreditCard className="h-5 w-5" />,
      label: 'Payments',
      href: '/bookings',
      color: 'bg-yellow-500 hover:bg-yellow-600',
    },
    ...(isTutor
      ? [
          {
            icon: <Users className="h-5 w-5" />,
            label: 'My Students',
            href: '/lessons',
            color: 'bg-teal-500 hover:bg-teal-600',
          },
        ]
      : []),
    {
      icon: <Settings className="h-5 w-5" />,
      label: 'Settings',
      href: '/settings',
      color: 'bg-gray-500 hover:bg-gray-600',
    },
  ]

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <Link
            key={index}
            href={action.href}
            className={`${action.color} text-white p-4 rounded-lg flex flex-col items-center justify-center gap-2 transition-all transform hover:scale-105 shadow-sm`}
          >
            {action.icon}
            <span className="text-xs font-medium text-center">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

