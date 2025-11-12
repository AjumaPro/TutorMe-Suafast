'use client'

import { Trophy, Star, Target, Award, Zap, BookOpen, Users, Clock } from 'lucide-react'

const getIcon = (iconType?: string) => {
  switch (iconType) {
    case 'zap':
      return <Zap className="h-5 w-5" />
    case 'target':
      return <Target className="h-5 w-5" />
    case 'clock':
      return <Clock className="h-5 w-5" />
    case 'award':
      return <Award className="h-5 w-5" />
    case 'trophy':
      return <Trophy className="h-5 w-5" />
    case 'star':
      return <Star className="h-5 w-5" />
    case 'book':
      return <BookOpen className="h-5 w-5" />
    case 'users':
      return <Users className="h-5 w-5" />
    default:
      return <Award className="h-5 w-5" />
  }
}

interface Badge {
  id: string
  name: string
  description: string
  icon?: React.ReactNode
  iconType?: 'zap' | 'target' | 'clock' | 'award' | 'trophy' | 'star' | 'book' | 'users'
  earned: boolean
  progress?: number
  color: string
}

interface AchievementBadgesProps {
  badges: Badge[]
}

export default function AchievementBadges({ badges }: AchievementBadgesProps) {
  const earnedBadges = badges.filter((b) => b.earned)
  const inProgressBadges = badges.filter((b) => !b.earned && b.progress && b.progress > 0)

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Achievements
        </h3>
        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">
          {earnedBadges.length}/{badges.length}
        </span>
      </div>

      <div className="space-y-4">
        {earnedBadges.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2 uppercase">Earned</p>
            <div className="grid grid-cols-3 gap-3">
              {earnedBadges.slice(0, 6).map((badge) => (
                <div
                  key={badge.id}
                  className="flex flex-col items-center p-3 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg border-2 border-yellow-300"
                >
                  <div className={`${badge.color} p-2 rounded-full mb-2`}>
                    {badge.icon || getIcon(badge.iconType)}
                  </div>
                  <p className="text-xs font-medium text-gray-900 text-center">{badge.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {inProgressBadges.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2 uppercase">In Progress</p>
            <div className="space-y-2">
              {inProgressBadges.slice(0, 3).map((badge) => (
                <div key={badge.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`${badge.color} p-1.5 rounded`}>
                      {badge.icon || getIcon(badge.iconType)}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-900">{badge.name}</p>
                      <p className="text-xs text-gray-500">{badge.description}</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-pink-600 h-1.5 rounded-full transition-all"
                      style={{ width: `${badge.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-right">{badge.progress}%</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {earnedBadges.length === 0 && inProgressBadges.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            <Award className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Start earning achievements!</p>
          </div>
        )}
      </div>
    </div>
  )
}

