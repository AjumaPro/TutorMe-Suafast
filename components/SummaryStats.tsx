'use client'

import { FileStack, Clock, Calendar, TrendingUp } from 'lucide-react'

interface SummaryStatsProps {
  totalClasses: number
  totalHours: string
  totalShifts: number
}

export default function SummaryStats({
  totalClasses,
  totalHours,
  totalShifts,
}: SummaryStatsProps) {
  const stats = [
    {
      label: 'total class',
      value: totalClasses.toString(),
      icon: FileStack,
      color: 'text-gray-600',
    },
    {
      label: 'total hours',
      value: totalHours,
      icon: Clock,
      color: 'text-purple-600',
      highlight: true,
    },
    {
      label: 'total shift',
      value: totalShifts.toString(),
      icon: Calendar,
      color: 'text-gray-600',
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((stat, idx) => {
        const Icon = stat.icon
        return (
          <div
            key={idx}
            className={`bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow ${
              stat.highlight ? 'ring-2 ring-purple-200' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <Icon className={`h-5 w-5 ${stat.color}`} />
              <TrendingUp className="h-4 w-4 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
            <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        )
      })}
    </div>
  )
}

