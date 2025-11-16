'use client'

import { useState, useEffect } from 'react'
import { BookOpen, DollarSign, TrendingUp, Calendar, Download, RefreshCw, Filter, User, Clock, CheckCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'
import Link from 'next/link'

interface TutorPaymentData {
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

interface Summary {
  totalTutors: number
  totalOrders: number
  totalEarnings: number
  totalPayoutsOwed: number
}

export default function TutorPaymentsOverview() {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [tutorData, setTutorData] = useState<TutorPaymentData[]>([])
  const [summary, setSummary] = useState<Summary>({
    totalTutors: 0,
    totalOrders: 0,
    totalEarnings: 0,
    totalPayoutsOwed: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedTutor, setSelectedTutor] = useState<string>('')

  useEffect(() => {
    fetchData()
  }, [period, selectedTutor])

  const fetchData = async () => {
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        setError(errorData.error || `Failed to fetch data (${response.status})`)
        setLoading(false)
        return
      }

      const data = await response.json()
      console.log('Fetched tutor statistics:', data)
      
      setTutorData(data.statistics || [])
      setSummary(data.summary || {
        totalTutors: 0,
        totalOrders: 0,
        totalEarnings: 0,
        totalPayoutsOwed: 0,
      })
    } catch (err) {
      console.error('Error fetching data:', err)
      setError(`Failed to load tutor payment data: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const formatPeriod = (periodKey: string): string => {
    if (!periodKey) return 'Unknown'
    
    try {
      if (period === 'daily') {
        const date = new Date(periodKey)
        if (isNaN(date.getTime())) return periodKey
        return date.toLocaleDateString('en-GH', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      } else if (period === 'weekly') {
        const date = new Date(periodKey)
        if (isNaN(date.getTime())) return periodKey
        const weekEnd = new Date(date)
        weekEnd.setDate(date.getDate() + 6)
        return `${date.toLocaleDateString('en-GH', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-GH', { month: 'short', day: 'numeric', year: 'numeric' })}`
      } else {
        const [year, month] = periodKey.split('-')
        if (!year || !month) return periodKey
        const date = new Date(parseInt(year), parseInt(month) - 1)
        if (isNaN(date.getTime())) return periodKey
        return date.toLocaleDateString('en-GH', { month: 'long', year: 'numeric' })
      }
    } catch (err) {
      console.error('Error formatting period:', err, periodKey)
      return periodKey
    }
  }

  const exportToCSV = () => {
    const headers = [
      'Period',
      'Tutor Name',
      'Tutor Email',
      'Total Orders',
      'Total Earnings',
      'Payouts Owed',
      'Completed Orders',
      'Pending Orders',
      'Paid Payments',
      'Pending Withdrawals',
    ]

    const rows = tutorData.map((data) => [
      formatPeriod(data.period),
      data.tutorName,
      data.tutorEmail,
      data.totalOrders,
      data.totalEarnings.toFixed(2),
      data.totalPayoutsOwed.toFixed(2),
      data.completedOrders,
      data.pendingOrders,
      data.paidPayments,
      data.pendingWithdrawals,
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tutor-payments-${period}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Get unique tutors for filter
  const uniqueTutors = tutorData
    .filter((d) => d && d.tutorId && d.tutorName)
    .map((d) => ({ id: d.tutorId, name: d.tutorName }))
    .filter((t, index, self) => index === self.findIndex((s) => s.id === t.id))

  // Group data by tutor (aggregate across all periods)
  const tutorSummary = tutorData.reduce((acc, data) => {
    if (!data || !data.tutorId) return acc
    
    if (!acc[data.tutorId]) {
      acc[data.tutorId] = {
        tutorId: data.tutorId,
        tutorName: data.tutorName || 'Unknown',
        tutorEmail: data.tutorEmail || '',
        totalOrders: 0,
        totalEarnings: 0,
        totalPayoutsOwed: 0,
        completedOrders: 0,
        pendingOrders: 0,
        paidPayments: 0,
        pendingWithdrawals: 0,
        currency: data.currency || 'GHS',
      }
    }
    acc[data.tutorId].totalOrders += data.totalOrders || 0
    acc[data.tutorId].totalEarnings += data.totalEarnings || 0
    acc[data.tutorId].totalPayoutsOwed += data.totalPayoutsOwed || 0
    acc[data.tutorId].completedOrders += data.completedOrders || 0
    acc[data.tutorId].pendingOrders += data.pendingOrders || 0
    acc[data.tutorId].paidPayments += data.paidPayments || 0
    acc[data.tutorId].pendingWithdrawals += data.pendingWithdrawals || 0
    return acc
  }, {} as Record<string, TutorPaymentData>)

  const tutorsList = Object.values(tutorSummary).filter(Boolean)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="h-8 w-8 text-pink-600" />
            <h1 className="text-3xl font-bold text-pink-600">Tutor Payments Overview</h1>
          </div>
          <p className="text-gray-600">View orders, earnings, and payouts for each tutor</p>
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
            onClick={fetchData}
            disabled={loading}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Tutors</p>
              <p className="text-3xl font-bold text-gray-900">{summary.totalTutors}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <User className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Orders</p>
              <p className="text-3xl font-bold text-gray-900">{summary.totalOrders}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Earnings</p>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(summary.totalEarnings, 'GHS')}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Payouts Owed</p>
              <p className="text-3xl font-bold text-yellow-600">
                {formatCurrency(summary.totalPayoutsOwed, 'GHS')}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Period:</span>
            <div className="flex gap-2">
              {(['daily', 'weekly', 'monthly'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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
              <User className="h-4 w-4 text-gray-600" />
              <select
                value={selectedTutor}
                onChange={(e) => setSelectedTutor(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
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

      {/* Tutor Payment Cards */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-200">
          <RefreshCw className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading tutor payment data...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <p className="text-red-800">{error}</p>
        </div>
      ) : tutorsList.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-200 relative">
          <div className="absolute top-4 right-4">
            <div className="flex gap-1">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          </div>
          <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No tutor payments yet</h3>
          <p className="text-gray-600">
            Tutor payment records will appear here once bookings are completed and payments are processed.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tutorsList.map((tutor) => (
            <div
              key={tutor.tutorId}
              className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">{tutor.tutorName}</h3>
                  <p className="text-sm text-gray-600">{tutor.tutorEmail}</p>
                </div>
                <Link
                  href={`/admin?tab=payments${selectedTutor ? `&tutorId=${tutor.tutorId}` : ''}`}
                  className="text-sm text-pink-600 hover:text-pink-700 font-medium"
                >
                  View Details →
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Orders */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Total Orders</span>
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{tutor.totalOrders}</p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      {tutor.completedOrders} completed
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-yellow-600" />
                      {tutor.pendingOrders} pending
                    </span>
                  </div>
                </div>

                {/* Total Earnings */}
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Total Earnings</span>
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(tutor.totalEarnings, tutor.currency as any)}
                  </p>
                  <div className="mt-2 text-xs text-gray-600">
                    <span>{tutor.paidPayments} paid payments</span>
                  </div>
                </div>

                {/* Payouts Owed */}
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Payouts Owed</span>
                    <TrendingUp className="h-5 w-5 text-yellow-600" />
                  </div>
                  <p className="text-2xl font-bold text-yellow-600">
                    {formatCurrency(tutor.totalPayoutsOwed, tutor.currency as any)}
                  </p>
                  {tutor.pendingWithdrawals > 0 && (
                    <div className="mt-2 text-xs text-orange-600">
                      {formatCurrency(tutor.pendingWithdrawals, tutor.currency as any)} pending withdrawal
                    </div>
                  )}
                </div>
              </div>

              {/* Period Breakdown */}
              {tutorData.filter((d) => d.tutorId === tutor.tutorId).length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {period.charAt(0).toUpperCase() + period.slice(1)} Breakdown
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {tutorData
                      .filter((d) => d.tutorId === tutor.tutorId)
                      .slice(0, 3)
                      .map((data) => (
                        <div
                          key={`${data.tutorId}-${data.period}`}
                          className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                        >
                          <p className="text-xs font-medium text-gray-600 mb-1">
                            {formatPeriod(data.period)}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">Orders:</span>
                            <span className="text-sm font-semibold text-gray-900">
                              {data.totalOrders}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">Earnings:</span>
                            <span className="text-sm font-semibold text-green-600">
                              {formatCurrency(data.totalEarnings, data.currency as any)}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

