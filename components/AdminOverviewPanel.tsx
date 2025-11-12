'use client'

import { Users, CheckCircle, XCircle, DollarSign, BookOpen, TrendingUp, Video, UserCheck } from 'lucide-react'

interface AdminOverviewPanelProps {
  stats: {
    totalTutors: number
    approvedTutors: number
    pendingTutors: number
    totalStudents: number
    totalBookings: number
    activeBookings: number
    totalRevenue: number
    totalVideoSessions: number
  }
}

export default function AdminOverviewPanel({ stats }: AdminOverviewPanelProps) {
  const statCards = [
    {
      label: 'Total Tutors',
      value: stats.totalTutors,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Approved Tutors',
      value: stats.approvedTutors,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Pending Approval',
      value: stats.pendingTutors,
      icon: XCircle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      label: 'Total Students',
      value: stats.totalStudents,
      icon: UserCheck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'Total Bookings',
      value: stats.totalBookings,
      icon: BookOpen,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
    },
    {
      label: 'Active Bookings',
      value: stats.activeBookings,
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      label: 'Total Revenue',
      value: `$${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Video Sessions',
      value: stats.totalVideoSessions,
      icon: Video,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Platform Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div
                key={index}
                className={`${stat.bgColor} rounded-lg p-6 border-2 border-transparent hover:border-gray-200 transition-colors`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <CheckCircle className="h-8 w-8 text-yellow-600 mb-2" />
            <h4 className="font-semibold text-gray-800 mb-1">Review Pending Tutors</h4>
            <p className="text-sm text-gray-600">
              {stats.pendingTutors} tutor{stats.pendingTutors !== 1 ? 's' : ''} awaiting approval
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <UserCheck className="h-8 w-8 text-purple-600 mb-2" />
            <h4 className="font-semibold text-gray-800 mb-1">Manage Students</h4>
            <p className="text-sm text-gray-600">
              View and manage {stats.totalStudents} student{stats.totalStudents !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <BookOpen className="h-8 w-8 text-pink-600 mb-2" />
            <h4 className="font-semibold text-gray-800 mb-1">Class Assignments</h4>
            <p className="text-sm text-gray-600">
              {stats.activeBookings} active class{stats.activeBookings !== 1 ? 'es' : ''}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

