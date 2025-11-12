'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'

interface UserProfileCardProps {
  user: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string
  }
}

export default function UserProfileCard({ user }: UserProfileCardProps) {
  const { data: session } = useSession()
  const profileLink = session?.user?.role === 'TUTOR' ? '/tutor/profile' : '/settings'

  return (
    <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-6 shadow-md relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full -mr-16 -mt-16" />
      <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-yellow-200/40 to-orange-200/40 rounded-full" />

      <div className="relative z-10 flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold mb-3 ring-4 ring-white shadow-lg">
          {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-1">{user.name || 'User'}</h3>
        <p className="text-sm text-gray-600 mb-4">@{user.email?.split('@')[0] || 'user'}</p>

        <Link
          href={profileLink}
          className="w-full bg-white text-gray-800 font-medium py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-center"
        >
          Edit Profile
        </Link>

        <p className="text-sm text-gray-600 text-center mt-4 leading-relaxed">
          Eager learner with a passion for discovering new skills and knowledge. Always curious
          and ready to tackle new challenges.
        </p>
      </div>
    </div>
  )
}

