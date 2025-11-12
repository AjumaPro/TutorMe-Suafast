'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, BookOpen, User, Mail, Calendar, CheckCircle, XCircle, Edit, Trash2, RefreshCw, X } from 'lucide-react'

interface ClassAssignmentsPanelProps {
  assignments: any[]
  students: any[]
  tutors: any[]
}

export default function ClassAssignmentsPanel({ assignments, students, tutors }: ClassAssignmentsPanelProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all')
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null)
  const [showRemoveModal, setShowRemoveModal] = useState(false)
  const [showReassignModal, setShowReassignModal] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)

  const filteredAssignments = assignments.filter((assignment) => {
    const matchesSearch =
      assignment.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.tutor.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.subject.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'active' && (assignment.status === 'CONFIRMED' || assignment.status === 'PENDING')) ||
      (filterStatus === 'completed' && assignment.status === 'COMPLETED')

    return matchesSearch && matchesFilter
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleRemove = async () => {
    if (!selectedAssignment) return

    setLoading('remove')
    try {
      const response = await fetch(`/api/admin/assignments/${selectedAssignment.id}/remove`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.ok) {
        setShowRemoveModal(false)
        setSelectedAssignment(null)
        router.refresh()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to remove assignment')
      }
    } catch (error) {
      console.error('Error removing assignment:', error)
      alert('Failed to remove assignment')
    } finally {
      setLoading(null)
    }
  }

  const handleReassign = async (reassignData: any) => {
    if (!selectedAssignment) return

    setLoading('reassign')
    try {
      const response = await fetch(`/api/admin/assignments/${selectedAssignment.id}/reassign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(reassignData),
      })

      if (response.ok) {
        setShowReassignModal(false)
        setSelectedAssignment(null)
        router.refresh()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to reassign')
      }
    } catch (error) {
      console.error('Error reassigning:', error)
      alert('Failed to reassign')
    } finally {
      setLoading(null)
    }
  }

  const canModify = (assignment: any) => {
    return assignment.status === 'PENDING' || assignment.status === 'CONFIRMED'
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by student, tutor, or subject..."
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
              onClick={() => setFilterStatus('active')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'active'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'completed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completed
            </button>
          </div>
        </div>
      </div>

      {/* Assignments List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Class Assignments ({filteredAssignments.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredAssignments.length === 0 ? (
            <div className="p-12 text-center">
              <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No class assignments found</p>
            </div>
          ) : (
            filteredAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold">
                          {assignment.student.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">{assignment.student.name}</h4>
                          <p className="text-sm text-gray-600">{assignment.student.email}</p>
                        </div>
                      </div>
                      <span className="text-gray-400">→</span>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                          {assignment.tutor.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">{assignment.tutor.user.name}</h4>
                          <p className="text-sm text-gray-600">{assignment.tutor.user.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <BookOpen className="h-4 w-4" />
                        <span className="font-medium">{assignment.subject}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(assignment.scheduledAt).toLocaleDateString()} at{' '}
                          {new Date(assignment.scheduledAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <span className="font-medium">Duration:</span>
                        <span>{assignment.duration} minutes</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <span className="font-medium">Price:</span>
                        <span>${assignment.price.toFixed(2)}</span>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          assignment.status
                        )}`}
                      >
                        {assignment.status}
                      </span>
                    </div>
                  </div>

                  {canModify(assignment) && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedAssignment(assignment)
                          setShowReassignModal(true)
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                        title="Reassign to different tutor/class"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Reassign
                      </button>
                      <button
                        onClick={() => {
                          setSelectedAssignment(assignment)
                          setShowRemoveModal(true)
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
                        title="Remove from class"
                      >
                        <X className="h-4 w-4" />
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Remove Confirmation Modal */}
      {showRemoveModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Remove from Class</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to remove <strong>{selectedAssignment.student.name}</strong> from{' '}
                <strong>{selectedAssignment.tutor.user.name}</strong>&apos;s class ({selectedAssignment.subject})?
                This will cancel the booking.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleRemove}
                  disabled={loading === 'remove'}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading === 'remove' ? 'Removing...' : 'Confirm Remove'}
                </button>
                <button
                  onClick={() => {
                    setShowRemoveModal(false)
                    setSelectedAssignment(null)
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reassign Modal */}
      {showReassignModal && selectedAssignment && (
        <ReassignModal
          assignment={selectedAssignment}
          students={students}
          tutors={tutors.filter((t: any) => t.isApproved)}
          onClose={() => {
            setShowReassignModal(false)
            setSelectedAssignment(null)
          }}
          onReassign={handleReassign}
          loading={loading === 'reassign'}
        />
      )}
    </div>
  )
}

function ReassignModal({ assignment, students, tutors, onClose, onReassign, loading }: any) {
  const [tutorId, setTutorId] = useState(assignment.tutorId)
  const [studentId, setStudentId] = useState(assignment.studentId)
  const [subject, setSubject] = useState(assignment.subject)
  const [scheduledAt, setScheduledAt] = useState(
    new Date(assignment.scheduledAt).toISOString().slice(0, 16)
  )
  const [duration, setDuration] = useState(assignment.duration)
  const [price, setPrice] = useState(assignment.price)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const reassignData: any = {}
    
    if (tutorId !== assignment.tutorId) reassignData.tutorId = tutorId
    if (studentId !== assignment.studentId) reassignData.studentId = studentId
    if (subject !== assignment.subject) reassignData.subject = subject
    if (new Date(scheduledAt).getTime() !== new Date(assignment.scheduledAt).getTime()) {
      reassignData.scheduledAt = new Date(scheduledAt).toISOString()
    }
    if (duration !== assignment.duration) reassignData.duration = duration
    if (price !== assignment.price) reassignData.price = price

    if (Object.keys(reassignData).length === 0) {
      alert('No changes detected')
      return
    }

    onReassign(reassignData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-800">Reassign Class</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student
                </label>
                <select
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  required
                >
                  {students.map((student: any) => (
                    <option key={student.id} value={student.id}>
                      {student.name} ({student.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tutor
                </label>
                <select
                  value={tutorId}
                  onChange={(e) => setTutorId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  required
                >
                  {tutors.map((tutor: any) => (
                    <option key={tutor.id} value={tutor.id}>
                      {tutor.user.name} - {JSON.parse(tutor.subjects || '[]').join(', ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scheduled Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  min="30"
                  max="180"
                  step="30"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price ($)
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(parseFloat(e.target.value))}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Reassigning...' : 'Reassign Class'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

