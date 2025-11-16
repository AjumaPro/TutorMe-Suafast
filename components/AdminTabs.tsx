'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Users, CheckCircle, UserCheck, BookOpen, Settings, DollarSign, TrendingUp, CreditCard } from 'lucide-react'

export default function AdminTabs() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') || 'overview'

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Settings },
    { id: 'tutors', label: 'Tutor Approval', icon: CheckCircle },
    { id: 'students', label: 'Student Management', icon: Users },
    { id: 'assignments', label: 'Class Assignments', icon: BookOpen },
    { id: 'pricing', label: 'Pricing Rules', icon: DollarSign },
    // Only show statistics tab for admins
    ...(session?.user.role === 'ADMIN' ? [{ id: 'statistics', label: 'Tutor Statistics', icon: TrendingUp }] : []),
    // Only show payments tab for admins
    ...(session?.user.role === 'ADMIN' ? [{ id: 'payments', label: 'Payment Records', icon: CreditCard }] : []),
    // Only show tutor payments overview tab for admins
    ...(session?.user.role === 'ADMIN' ? [{ id: 'tutor-payments', label: 'Tutor Payments', icon: TrendingUp }] : []),
  ]

  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <Link
              key={tab.id}
              href={`/admin?tab=${tab.id}`}
              className={`
                flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  isActive
                    ? 'border-pink-500 text-pink-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <Icon className="h-5 w-5" />
              {tab.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

