'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Search, Filter, User, Mail, Calendar, DollarSign, Award } from 'lucide-react'

interface TutorApprovalPanelProps {
  pendingTutors: any[]
  approvedTutors: any[]
}

export default function TutorApprovalPanel({ pendingTutors, approvedTutors }: TutorApprovalPanelProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved'>('all')
  const [selectedTutor, setSelectedTutor] = useState<any | null>(null)

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
        setSelectedTutor(null)
      }
    } catch (err) {
      console.error('Error updating tutor approval:', err)
      alert('Failed to update tutor approval')
    } finally {
      setLoading(null)
    }
  }

  const filteredTutors = (filterStatus === 'pending' ? pendingTutors : filterStatus === 'approved' ? approvedTutors : [...pendingTutors, ...approvedTutors])
    .filter((tutor) => {
      const searchLower = searchTerm.toLowerCase()
      return (
        tutor.user.name.toLowerCase().includes(searchLower) ||
        tutor.user.email.toLowerCase().includes(searchLower) ||
        (tutor.bio && tutor.bio.toLowerCase().includes(searchLower)) ||
        (tutor.subjects && JSON.parse(tutor.subjects || '[]').some((s: string) => s.toLowerCase().includes(searchLower)))
      )
    })

  const parseSubjects = (subjects: string) => {
    try {
      return JSON.parse(subjects || '[]')
    } catch {
      return []
    }
  }

  const parseGrades = (grades: string) => {
    try {
      return JSON.parse(grades || '[]')
    } catch {
      return []
    }
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'all'
                  ? 'bg-pink-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending ({pendingTutors.length})
            </button>
            <button
              onClick={() => setFilterStatus('approved')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'approved'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Approved ({approvedTutors.length})
            </button>
          </div>
        </div>
      </div>

      {/* Tutors List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            {filterStatus === 'pending' ? 'Pending Approvals' : filterStatus === 'approved' ? 'Approved Tutors' : 'All Tutors'} ({filteredTutors.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredTutors.length === 0 ? (
            <div className="p-12 text-center">
              <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No tutors found</p>
            </div>
          ) : (
            filteredTutors.map((tutor) => {
              const subjects = parseSubjects(tutor.subjects)
              const grades = parseGrades(tutor.grades)
              const isPending = !tutor.isApproved

              return (
                <div
                  key={tutor.id}
                  className={`p-6 hover:bg-gray-50 transition-colors cursor-pointer ${
                    selectedTutor?.id === tutor.id ? 'bg-pink-50' : ''
                  }`}
                  onClick={() => setSelectedTutor(tutor)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                          {tutor.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg text-gray-800">{tutor.user.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="h-4 w-4" />
                            {tutor.user.email}
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            isPending
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {isPending ? 'Pending' : 'Approved'}
                        </span>
                      </div>

                      {tutor.bio && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{tutor.bio}</p>
                      )}

                      <div className="flex flex-wrap gap-2 mt-3">
                        {subjects.map((subject: string) => (
                          <span
                            key={subject}
                            className="px-2 py-1 bg-pink-100 text-pink-700 text-xs rounded font-medium"
                          >
                            {subject}
                          </span>
                        ))}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span className="font-medium">${tutor.hourlyRate}/hour</span>
                        </div>
                        {tutor.experience && (
                          <div className="flex items-center gap-1">
                            <Award className="h-4 w-4" />
                            <span>{tutor.experience} years experience</span>
                          </div>
                        )}
                        {grades.length > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Grades:</span>
                            <span>{grades.join(', ')}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Joined {new Date(tutor.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {isPending && (
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleApprove(tutor.id, true)
                          }}
                          disabled={loading === tutor.id}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 flex items-center gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          {loading === tutor.id ? 'Processing...' : 'Approve'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleApprove(tutor.id, false)
                          }}
                          disabled={loading === tutor.id}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 flex items-center gap-2"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

