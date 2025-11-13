'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, CheckCircle, XCircle, DollarSign, BookOpen } from 'lucide-react'
import { formatCurrency, parseCurrencyCode } from '@/lib/currency'

export default function AdminDashboard({ stats, pendingTutors }: any) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleApprove = async (tutorId: string, approve: boolean) => {
    setLoading(tutorId)
    try {
      const response = await fetch(`/api/admin/tutors/${tutorId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: approve }),
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (err) {
      console.error('Error updating tutor approval:', err)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tutors</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTutors}</p>
            </div>
            <Users className="h-8 w-8 text-primary-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved Tutors</p>
              <p className="text-2xl font-bold text-green-600">{stats.approvedTutors}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Approval</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingTutors}</p>
            </div>
            <XCircle className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-primary-600">
                ${stats.totalRevenue._sum.platformFee?.toFixed(2) || '0.00'}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-primary-600" />
          </div>
        </div>
      </div>

      {/* Pending Tutors */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Pending Tutor Approvals</h2>
        {pendingTutors.length === 0 ? (
          <p className="text-gray-500">No pending tutor approvals.</p>
        ) : (
          <div className="space-y-4">
            {pendingTutors.map((tutor: any) => (
              <div
                key={tutor.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{tutor.user.name}</h3>
                    <p className="text-sm text-gray-600">{tutor.user.email}</p>
                    {tutor.bio && (
                      <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                        {tutor.bio}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {tutor.subjects.map((subject: string) => (
                        <span
                          key={subject}
                          className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded"
                        >
                          {subject}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 text-sm text-gray-600">
                      <span className="font-medium">Rate:</span> {formatCurrency(tutor.hourlyRate, parseCurrencyCode(tutor.currency))}/hour
                      {tutor.experience && (
                        <>
                          {' • '}
                          <span className="font-medium">Experience:</span> {tutor.experience} years
                        </>
                      )}
                    </div>
                  </div>
                  <div className="ml-6 flex space-x-2">
                    <button
                      onClick={() => handleApprove(tutor.id, true)}
                      disabled={loading === tutor.id}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 flex items-center"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      {loading === tutor.id ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleApprove(tutor.id, false)}
                      disabled={loading === tutor.id}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 flex items-center"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

