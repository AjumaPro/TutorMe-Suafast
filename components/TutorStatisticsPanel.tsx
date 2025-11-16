'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { DollarSign, ShoppingCart, TrendingUp, Calendar, Download, RefreshCw, Filter } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'

interface TutorStatistic {
  tutorId: string
  tutorName: string
  tutorEmail: string
  period: string
  totalOrders: number
  totalEarnings: number
  totalPayoutsOwed: number
  completedOrders: number
  pendingOrders: number
  paidPayments: number
  pendingWithdrawals: number
  currency: string
}

interface TutorStatisticsPanelProps {
  initialPeriod?: 'daily' | 'weekly' | 'monthly'
}

export default function TutorStatisticsPanel({ initialPeriod = 'daily' }: TutorStatisticsPanelProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>(initialPeriod)
  const [statistics, setStatistics] = useState<TutorStatistic[]>([])
  const [summary, setSummary] = useState({
    totalTutors: 0,
    totalOrders: 0,
    totalEarnings: 0,
    totalPayoutsOwed: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedTutor, setSelectedTutor] = useState<string>('')

  // Check admin access
  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'ADMIN') {
      router.push('/auth/signin')
      return
    }
  }, [session, status, router])

  useEffect(() => {
    if (session?.user.role === 'ADMIN') {
      fetchStatistics()
    }
  }, [period, selectedTutor, session])

  const fetchStatistics = async () => {
    // Double-check admin access
    if (!session || session.user.role !== 'ADMIN') {
      setError('Unauthorized. Admin access required.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ period })
      if (selectedTutor) {
        params.append('tutorId', selectedTutor)
      }

      const response = await fetch(`/api/admin/tutor-statistics?${params.toString()}`, {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setStatistics(data.statistics || [])
        setSummary(data.summary || {
          totalTutors: 0,
          totalOrders: 0,
          totalEarnings: 0,
          totalPayoutsOwed: 0,
        })
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to fetch statistics')
      }
    } catch (err) {
      console.error('Error fetching statistics:', err)
      setError('Failed to load statistics')
    } finally {
      setLoading(false)
    }
  }

  const formatPeriod = (periodKey: string): string => {
    if (period === 'daily') {
      const date = new Date(periodKey)
      return date.toLocaleDateString('en-GH', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } else if (period === 'weekly') {
      const date = new Date(periodKey)
      const weekEnd = new Date(date)
      weekEnd.setDate(date.getDate() + 6)
      return `${date.toLocaleDateString('en-GH', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-GH', { month: 'short', day: 'numeric', year: 'numeric' })}`
    } else {
      const [year, month] = periodKey.split('-')
      const date = new Date(parseInt(year), parseInt(month) - 1)
      return date.toLocaleDateString('en-GH', { month: 'long', year: 'numeric' })
    }
  }

  const exportToCSV = () => {
    const headers = ['Period', 'Tutor Name', 'Tutor Email', 'Total Orders', 'Total Earnings', 'Payouts Owed', 'Completed Orders', 'Pending Orders', 'Paid Payments', 'Pending Withdrawals']
    const rows = statistics.map((stat) => [
      formatPeriod(stat.period),
      stat.tutorName,
      stat.tutorEmail,
      stat.totalOrders,
      stat.totalEarnings.toFixed(2),
      stat.totalPayoutsOwed.toFixed(2),
      stat.completedOrders,
      stat.pendingOrders,
      stat.paidPayments,
      stat.pendingWithdrawals,
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tutor-statistics-${period}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Get unique tutors for filter
  const uniqueTutors = [...new Set(statistics.map((s) => ({ id: s.tutorId, name: s.tutorName })))]
    .map((t) => ({ id: t.id, name: t.name }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-pink-600" />
              Tutor Statistics
            </h2>
            <p className="text-gray-600 mt-1">Orders, earnings, and payouts by time period</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={fetchStatistics}
              disabled={loading}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Period:</span>
            <div className="flex gap-2">
              {(['daily', 'weekly', 'monthly'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    period === p
                      ? 'bg-pink-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {uniqueTutors.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Tutor:</span>
              <select
                value={selectedTutor}
                onChange={(e) => setSelectedTutor(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="">All Tutors</option>
                {uniqueTutors.map((tutor) => (
                  <option key={tutor.id} value={tutor.id}>
                    {tutor.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Tutors</p>
              <p className="text-3xl font-bold text-gray-900">{summary.totalTutors}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Orders</p>
              <p className="text-3xl font-bold text-gray-900">{summary.totalOrders}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Earnings</p>
              <p className="text-3xl font-bold text-gray-900">
                ₵{summary.totalEarnings.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Payouts Owed</p>
              <p className="text-3xl font-bold text-yellow-600">
                ₵{summary.totalPayoutsOwed.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Access Check */}
      {status === 'loading' ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <RefreshCw className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verifying access...</p>
        </div>
      ) : session?.user.role !== 'ADMIN' ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-medium">Access Denied</p>
          <p className="text-red-600 text-sm mt-2">This section is only available to administrators.</p>
        </div>
      ) : loading ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <RefreshCw className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading statistics...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      ) : statistics.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No statistics found for the selected period</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tutor
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Orders
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completed
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pending
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Earnings
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payouts Owed
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paid Payments
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pending Withdrawals
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {statistics.map((stat, index) => (
                  <tr key={`${stat.tutorId}-${stat.period}-${index}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPeriod(stat.period)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{stat.tutorName}</div>
                      <div className="text-sm text-gray-500">{stat.tutorEmail}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {stat.totalOrders}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-right">
                      {stat.completedOrders}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 text-right">
                      {stat.pendingOrders}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                      {formatCurrency(stat.totalEarnings, stat.currency as any)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-yellow-600 text-right">
                      {formatCurrency(stat.totalPayoutsOwed, stat.currency as any)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                      {stat.paidPayments}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 text-right">
                      {formatCurrency(stat.pendingWithdrawals, stat.currency as any)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

