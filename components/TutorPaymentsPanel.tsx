'use client'

import { useState, useEffect } from 'react'
import { DollarSign, Search, Filter, Download, RefreshCw, CheckCircle, Clock, XCircle, User, BookOpen, Calendar } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'
import Link from 'next/link'

interface PaymentRecord {
  bookingId: string
  tutorId: string
  tutorName: string
  tutorEmail: string
  studentId: string
  studentName: string
  studentEmail: string
  subject: string
  scheduledAt: string
  duration: number
  bookingPrice: number
  currency: string
  paymentId: string | null
  paymentAmount: number
  platformFee: number
  tutorPayout: number
  paymentStatus: string
  paidAt: string | null
  createdAt: string
}

interface Summary {
  totalCompletedClasses: number
  totalBookingsWithPayments: number
  totalRevenue: number
  totalPlatformFees: number
  totalTutorPayouts: number
  paidPayments: number
  pendingPayments: number
}

export default function TutorPaymentsPanel() {
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([])
  const [summary, setSummary] = useState<Summary>({
    totalCompletedClasses: 0,
    totalBookingsWithPayments: 0,
    totalRevenue: 0,
    totalPlatformFees: 0,
    totalTutorPayouts: 0,
    paidPayments: 0,
    pendingPayments: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [tutorFilter, setTutorFilter] = useState<string>('')

  useEffect(() => {
    fetchPayments()
  }, [statusFilter, tutorFilter])

  const fetchPayments = async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      if (tutorFilter) {
        params.append('tutorId', tutorFilter)
      }

      const response = await fetch(`/api/admin/payments?${params.toString()}`, {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setPaymentRecords(data.paymentRecords || [])
        setSummary(data.summary || {
          totalCompletedClasses: 0,
          totalBookingsWithPayments: 0,
          totalRevenue: 0,
          totalPlatformFees: 0,
          totalTutorPayouts: 0,
          paidPayments: 0,
          pendingPayments: 0,
        })
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to fetch payment records')
      }
    } catch (err) {
      console.error('Error fetching payments:', err)
      setError('Failed to load payment records')
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    const headers = [
      'Tutor Name',
      'Tutor Email',
      'Student Name',
      'Student Email',
      'Subject',
      'Scheduled Date',
      'Duration (min)',
      'Booking Price',
      'Payment Amount',
      'Platform Fee',
      'Tutor Payout',
      'Payment Status',
      'Paid At',
    ]

    const rows = filteredRecords.map((record) => [
      record.tutorName,
      record.tutorEmail,
      record.studentName,
      record.studentEmail,
      record.subject,
      new Date(record.scheduledAt).toLocaleDateString(),
      record.duration,
      record.bookingPrice.toFixed(2),
      record.paymentAmount.toFixed(2),
      record.platformFee.toFixed(2),
      record.tutorPayout.toFixed(2),
      record.paymentStatus,
      record.paidAt ? new Date(record.paidAt).toLocaleDateString() : 'N/A',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tutor-payments-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Get unique tutors for filter
  const uniqueTutors = [...new Set(paymentRecords.map((r) => ({ id: r.tutorId, name: r.tutorName })))]
    .map((t) => ({ id: t.id, name: t.name }))

  // Filter records based on search term
  const filteredRecords = paymentRecords.filter((record) => {
    const matchesSearch =
      searchTerm === '' ||
      record.tutorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.tutorEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.subject.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3" />
            Paid
          </span>
        )
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-3 w-3" />
            {status}
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Completed Classes</p>
              <p className="text-3xl font-bold text-gray-900">{summary.totalCompletedClasses}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(summary.totalRevenue, 'GHS')}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Platform Fees</p>
              <p className="text-3xl font-bold text-purple-600">
                {formatCurrency(summary.totalPlatformFees, 'GHS')}
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
              <p className="text-sm font-medium text-gray-600 mb-1">Tutor Payouts</p>
              <p className="text-3xl font-bold text-yellow-600">
                {formatCurrency(summary.totalTutorPayouts, 'GHS')}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-pink-600" />
            Payment Records
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={fetchPayments}
              disabled={loading}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by tutor, student, or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-600" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="all">All Status</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>

          {uniqueTutors.length > 0 && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-600" />
              <select
                value={tutorFilter}
                onChange={(e) => setTutorFilter(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
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

      {/* Payment Records Table */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <RefreshCw className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading payment records...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No payment records found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tutor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booking Price
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Amount
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Platform Fee
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tutor Payout
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.map((record) => (
                  <tr key={record.bookingId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{record.tutorName}</div>
                      <div className="text-sm text-gray-500">{record.tutorEmail}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{record.studentName}</div>
                      <div className="text-sm text-gray-500">{record.studentEmail}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.subject}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(record.scheduledAt).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(record.scheduledAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(record.bookingPrice, record.currency as any)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                      {formatCurrency(record.paymentAmount, record.currency as any)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right">
                      -{formatCurrency(record.platformFee, record.currency as any)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600 text-right">
                      {formatCurrency(record.tutorPayout, record.currency as any)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {getStatusBadge(record.paymentStatus)}
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

