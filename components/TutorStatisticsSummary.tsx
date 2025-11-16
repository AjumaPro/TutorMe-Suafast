'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, ShoppingCart, DollarSign, Clock, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/currency'

interface StatisticsSummary {
  totalOrders: number
  totalEarnings: number
  totalPayoutsOwed: number
}

export default function TutorStatisticsSummary() {
  const [dailyStats, setDailyStats] = useState<StatisticsSummary>({
    totalOrders: 0,
    totalEarnings: 0,
    totalPayoutsOwed: 0,
  })
  const [weeklyStats, setWeeklyStats] = useState<StatisticsSummary>({
    totalOrders: 0,
    totalEarnings: 0,
    totalPayoutsOwed: 0,
  })
  const [monthlyStats, setMonthlyStats] = useState<StatisticsSummary>({
    totalOrders: 0,
    totalEarnings: 0,
    totalPayoutsOwed: 0,
  })
  const [totalTutors, setTotalTutors] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStatistics()
  }, [])

  const fetchStatistics = async () => {
    setLoading(true)
    try {
      const [dailyRes, weeklyRes, monthlyRes] = await Promise.all([
        fetch('/api/admin/tutor-statistics?period=daily', { credentials: 'include' }),
        fetch('/api/admin/tutor-statistics?period=weekly', { credentials: 'include' }),
        fetch('/api/admin/tutor-statistics?period=monthly', { credentials: 'include' }),
      ])

      if (dailyRes.ok) {
        const dailyData = await dailyRes.json()
        setDailyStats(dailyData.summary || { totalOrders: 0, totalEarnings: 0, totalPayoutsOwed: 0 })
      }

      if (weeklyRes.ok) {
        const weeklyData = await weeklyRes.json()
        setWeeklyStats(weeklyData.summary || { totalOrders: 0, totalEarnings: 0, totalPayoutsOwed: 0 })
      }

      if (monthlyRes.ok) {
        const monthlyData = await monthlyRes.json()
        setMonthlyStats(monthlyData.summary || { totalOrders: 0, totalEarnings: 0, totalPayoutsOwed: 0 })
        setTotalTutors(monthlyData.summary?.totalTutors || 0)
      }
    } catch (error) {
      console.error('Error fetching statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ 
    period, 
    stats, 
    color 
  }: { 
    period: string
    stats: StatisticsSummary
    color: string
  }) => (
    <div className={`bg-gradient-to-br ${color} rounded-lg p-6 border border-gray-200 shadow-sm`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{period}</h3>
        <TrendingUp className="h-5 w-5 text-gray-600" />
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-gray-600" />
            <span className="text-sm text-gray-700">Orders</span>
          </div>
          <span className="text-lg font-bold text-gray-900">{stats.totalOrders}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-gray-600" />
            <span className="text-sm text-gray-700">Earnings</span>
          </div>
          <span className="text-lg font-bold text-gray-900">
            {formatCurrency(stats.totalEarnings, 'GHS')}
          </span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Payouts Owed</span>
          </div>
          <span className="text-lg font-bold text-yellow-700">
            {formatCurrency(stats.totalPayoutsOwed, 'GHS')}
          </span>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-pink-600" />
            Tutor Statistics Summary
          </h2>
        </div>
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
          <p className="text-gray-600 mt-2">Loading statistics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-pink-600" />
          Tutor Statistics Summary
        </h2>
        <Link
          href="/admin?tab=statistics"
          className="flex items-center gap-2 text-sm text-pink-600 hover:text-pink-700 font-medium transition-colors"
        >
          View Details
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          period="Today"
          stats={dailyStats}
          color="from-blue-50 to-blue-100"
        />
        <StatCard
          period="This Week"
          stats={weeklyStats}
          color="from-green-50 to-green-100"
        />
        <StatCard
          period="This Month"
          stats={monthlyStats}
          color="from-purple-50 to-purple-100"
        />
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Tutors</p>
            <p className="text-2xl font-bold text-gray-900">{totalTutors}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Orders (This Month)</p>
            <p className="text-2xl font-bold text-gray-900">{monthlyStats.totalOrders}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Earnings (This Month)</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(monthlyStats.totalEarnings, 'GHS')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

