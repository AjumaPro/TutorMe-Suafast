'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, User, Mail, Calendar, BookOpen, Plus, Edit, Trash2, X, RefreshCw } from 'lucide-react'

interface StudentManagementPanelProps {
  students: any[]
  tutors: any[]
}

export default function StudentManagementPanel({ students, tutors }: StudentManagementPanelProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showRemoveModal, setShowRemoveModal] = useState(false)
  const [showReassignModal, setShowReassignModal] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  const filteredStudents = students.filter((student) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      student.name.toLowerCase().includes(searchLower) ||
      student.email.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="space-y-6">
      {/* Search and Actions */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search students by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
          <div className="text-sm text-gray-600">
            Total Students: <span className="font-semibold">{students.length}</span>
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">All Students ({filteredStudents.length})</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredStudents.length === 0 ? (
            <div className="p-12 text-center">
              <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No students found</p>
            </div>
          ) : (
            filteredStudents.map((student) => {
              const bookings = student.bookings || []
              const activeBookings = bookings.filter((b: any) => 
                b.status === 'CONFIRMED' || b.status === 'PENDING'
              )

              return (
                <div
                  key={student.id}
                  className={`p-6 hover:bg-gray-50 transition-colors ${
                    selectedStudent?.id === student.id ? 'bg-pink-50' : ''
                  }`}
                  onClick={() => setSelectedStudent(student)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg text-gray-800">{student.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="h-4 w-4" />
                            {student.email}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          <span>
                            {bookings.length} total booking{bookings.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        {activeBookings.length > 0 && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-medium">
                            {activeBookings.length} active
                          </span>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Joined {new Date(student.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Show active bookings */}
                      {activeBookings.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Active Classes:</h5>
                          <div className="space-y-2">
                            {activeBookings.slice(0, 3).map((booking: any) => (
                              <div
                                key={booking.id}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                              >
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-800">
                                    {booking.subject} with {booking.tutor.user.name}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    {new Date(booking.scheduledAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="flex gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedBooking(booking)
                                      setShowReassignModal(true)
                                    }}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                    title="Reassign"
                                  >
                                    <RefreshCw className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedBooking(booking)
                                      setShowRemoveModal(true)
                                    }}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="Remove"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                            {activeBookings.length > 3 && (
                              <p className="text-xs text-gray-500 text-center">
                                +{activeBookings.length - 3} more class{activeBookings.length - 3 !== 1 ? 'es' : ''}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedStudent(student)
                          setShowAssignModal(true)
                        }}
                        className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium flex items-center justify-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Assign Class
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Assign Class Modal */}
      {showAssignModal && selectedStudent && (
        <AssignClassModal
          student={selectedStudent}
          tutors={tutors}
          onClose={() => {
            setShowAssignModal(false)
            setSelectedStudent(null)
          }}
        />
      )}

      {/* Remove Booking Modal */}
      {showRemoveModal && selectedBooking && (
        <RemoveBookingModal
          booking={selectedBooking}
          onClose={() => {
            setShowRemoveModal(false)
            setSelectedBooking(null)
          }}
          onRemove={async () => {
            setLoading('remove')
            try {
              const response = await fetch(`/api/admin/assignments/${selectedBooking.id}/remove`, {
                method: 'DELETE',
                credentials: 'include',
              })

              if (response.ok) {
                setShowRemoveModal(false)
                setSelectedBooking(null)
                router.refresh()
              } else {
                const error = await response.json()
                alert(error.error || 'Failed to remove')
              }
            } catch (error) {
              console.error('Error removing booking:', error)
              alert('Failed to remove booking')
            } finally {
              setLoading(null)
            }
          }}
          loading={loading === 'remove'}
        />
      )}

      {/* Reassign Booking Modal */}
      {showReassignModal && selectedBooking && (
        <ReassignBookingModal
          booking={selectedBooking}
          students={students}
          tutors={tutors.filter((t: any) => t.isApproved)}
          onClose={() => {
            setShowReassignModal(false)
            setSelectedBooking(null)
          }}
          onReassign={async (reassignData: any) => {
            setLoading('reassign')
            try {
              const response = await fetch(`/api/admin/assignments/${selectedBooking.id}/reassign`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(reassignData),
              })

              if (response.ok) {
                setShowReassignModal(false)
                setSelectedBooking(null)
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
          }}
          loading={loading === 'reassign'}
        />
      )}
    </div>
  )
}

function AssignClassModal({ student, tutors, onClose }: any) {
  const router = useRouter()
  const [selectedTutor, setSelectedTutor] = useState('')
  const [subject, setSubject] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAssign = async () => {
    if (!selectedTutor || !subject) {
      alert('Please select a tutor and enter a subject')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/admin/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id,
          tutorId: selectedTutor,
          subject,
        }),
      })

      if (response.ok) {
        alert('Class assigned successfully!')
        onClose()
        router.refresh()
    } else {
      const error = await response.json()
      alert(error.error || 'Failed to assign class')
    }
  } catch (error) {
    console.error('Error assigning class:', error)
    alert('Failed to assign class')
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Assign Class to {student.name}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Tutor
              </label>
              <select
                value={selectedTutor}
                onChange={(e) => setSelectedTutor(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="">Choose a tutor...</option>
                {tutors
                  .filter((t: any) => t.isApproved)
                  .map((tutor: any) => (
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
                placeholder="e.g., Mathematics, English, Science"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleAssign}
              disabled={loading || !selectedTutor || !subject}
              className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Assigning...' : 'Assign Class'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function RemoveBookingModal({ booking, onClose, onRemove, loading }: any) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Remove from Class</h3>
          <p className="text-gray-600 mb-6">
            Are you sure you want to remove <strong>{booking.student.name}</strong> from{' '}
            <strong>{booking.tutor.user.name}</strong>&apos;s class ({booking.subject})?
            This will cancel the booking.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onRemove}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Removing...' : 'Confirm Remove'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ReassignBookingModal({ booking, students, tutors, onClose, onReassign, loading }: any) {
  const [tutorId, setTutorId] = useState(booking.tutorId)
  const [studentId, setStudentId] = useState(booking.studentId)
  const [subject, setSubject] = useState(booking.subject)
  const [scheduledAt, setScheduledAt] = useState(
    new Date(booking.scheduledAt).toISOString().slice(0, 16)
  )
  const [duration, setDuration] = useState(booking.duration)
  const [price, setPrice] = useState(booking.price)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const reassignData: any = {}
    
    if (tutorId !== booking.tutorId) reassignData.tutorId = tutorId
    if (studentId !== booking.studentId) reassignData.studentId = studentId
    if (subject !== booking.subject) reassignData.subject = subject
    if (new Date(scheduledAt).getTime() !== new Date(booking.scheduledAt).getTime()) {
      reassignData.scheduledAt = new Date(scheduledAt).toISOString()
    }
    if (duration !== booking.duration) reassignData.duration = duration
    if (price !== booking.price) reassignData.price = price

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

