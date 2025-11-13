'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Search, Filter, User, Mail, Calendar, Award, Trash2, Power, PowerOff, CalendarPlus, Edit2, X } from 'lucide-react'
import AdminScheduleBooking from './AdminScheduleBooking'
import { formatCurrency, parseCurrencyCode } from '@/lib/currency'

interface TutorApprovalPanelProps {
  pendingTutors: any[]
  approvedTutors: any[]
  students?: any[]
}

export default function TutorApprovalPanel({ pendingTutors, approvedTutors, students = [] }: TutorApprovalPanelProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved'>('all')
  const [selectedTutor, setSelectedTutor] = useState<any | null>(null)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [tutorToSchedule, setTutorToSchedule] = useState<any | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showPriceModal, setShowPriceModal] = useState(false)
  const [tutorToEditPrice, setTutorToEditPrice] = useState<any | null>(null)
  const [newPrice, setNewPrice] = useState('')
  const [newCurrency, setNewCurrency] = useState('GHS')

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
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update tutor approval')
      }
    } catch (err) {
      console.error('Error updating tutor approval:', err)
      alert('Failed to update tutor approval')
    } finally {
      setLoading(null)
    }
  }

  const handleToggleActive = async (tutorId: string, isActive: boolean) => {
    if (!confirm(`Are you sure you want to ${isActive ? 'activate' : 'deactivate'} this tutor?`)) {
      return
    }

    setLoading(tutorId)
    try {
      const response = await fetch(`/api/admin/tutors/${tutorId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      })

      if (response.ok) {
        router.refresh()
        setSelectedTutor(null)
      } else {
        const error = await response.json()
        const errorMsg = error.details 
          ? `${error.error}\n\n${error.details}` 
          : error.error || 'Failed to update tutor status'
        setErrorMessage(errorMsg)
        setTimeout(() => setErrorMessage(null), 5000)
      }
    } catch (err) {
      console.error('Error updating tutor status:', err)
      alert('Failed to update tutor status')
    } finally {
      setLoading(null)
    }
  }

  const handleDelete = async (tutorId: string) => {
    if (!confirm('Are you sure you want to remove this tutor? This action cannot be undone. Active bookings will prevent deletion.')) {
      return
    }

    setLoading(tutorId)
    try {
      const response = await fetch(`/api/admin/tutors/${tutorId}/delete`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.refresh()
        setSelectedTutor(null)
        setErrorMessage(null) // Clear any previous errors
      } else {
        const error = await response.json()
        setErrorMessage(error.error || 'Failed to remove tutor')
        setTimeout(() => setErrorMessage(null), 5000)
      }
    } catch (err) {
      console.error('Error deleting tutor:', err)
      setErrorMessage('Failed to remove tutor')
      setTimeout(() => setErrorMessage(null), 5000)
    } finally {
      setLoading(null)
    }
  }

  const handleOpenPriceModal = (tutor: any) => {
    setTutorToEditPrice(tutor)
    setNewPrice(tutor.hourlyRate.toString())
    setNewCurrency(tutor.currency || 'GHS')
    setShowPriceModal(true)
  }

  const handleUpdatePrice = async () => {
    if (!tutorToEditPrice) return

    const price = parseFloat(newPrice)
    if (isNaN(price) || price < 0) {
      setErrorMessage('Please enter a valid price')
      setTimeout(() => setErrorMessage(null), 5000)
      return
    }

    setLoading(tutorToEditPrice.id)
    try {
      const response = await fetch(`/api/admin/tutors/${tutorToEditPrice.id}/price`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hourlyRate: price,
          currency: newCurrency,
        }),
      })

      if (response.ok) {
        router.refresh()
        setShowPriceModal(false)
        setTutorToEditPrice(null)
        setNewPrice('')
        setErrorMessage(null)
      } else {
        const error = await response.json()
        setErrorMessage(error.error || 'Failed to update price')
        setTimeout(() => setErrorMessage(null), 5000)
      }
    } catch (err) {
      console.error('Error updating price:', err)
      setErrorMessage('Failed to update price')
      setTimeout(() => setErrorMessage(null), 5000)
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
      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <XCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-red-700 whitespace-pre-line">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-red-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

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
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              isPending
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {isPending ? 'Pending' : 'Approved'}
                          </span>
                          {!isPending && tutor.isActive !== undefined && (
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                tutor.isActive
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {tutor.isActive ? 'Active' : 'Inactive'}
                            </span>
                          )}
                        </div>
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
                          <span className="font-medium">
                            {formatCurrency(tutor.hourlyRate, parseCurrencyCode(tutor.currency))}/hour
                          </span>
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

                    <div className="flex gap-2">
                      {isPending && (
                        <>
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
                        </>
                      )}
                      {!isPending && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenPriceModal(tutor)
                            }}
                            disabled={loading === tutor.id}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center gap-2"
                            title="Edit Price"
                          >
                            <Edit2 className="h-4 w-4" />
                            Price
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setTutorToSchedule(tutor)
                              setShowScheduleModal(true)
                            }}
                            disabled={loading === tutor.id || students.length === 0}
                            className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            title={students.length === 0 ? 'No students available' : 'Schedule Lesson'}
                          >
                            <CalendarPlus className="h-4 w-4" />
                            Schedule
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleActive(tutor.id, tutor.isActive !== false)
                            }}
                            disabled={loading === tutor.id}
                            className={`px-4 py-2 rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 flex items-center gap-2 ${
                              tutor.isActive !== false
                                ? 'bg-gray-600 text-white focus:ring-gray-500'
                                : 'bg-blue-600 text-white focus:ring-blue-500'
                            }`}
                            title={tutor.isActive !== false ? 'Deactivate Tutor' : 'Activate Tutor'}
                          >
                            {tutor.isActive !== false ? (
                              <>
                                <PowerOff className="h-4 w-4" />
                                {loading === tutor.id ? 'Processing...' : 'Deactivate'}
                              </>
                            ) : (
                              <>
                                <Power className="h-4 w-4" />
                                {loading === tutor.id ? 'Processing...' : 'Activate'}
                              </>
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(tutor.id)
                            }}
                            disabled={loading === tutor.id}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 flex items-center gap-2"
                            title="Remove Tutor"
                          >
                            <Trash2 className="h-4 w-4" />
                            {loading === tutor.id ? 'Processing...' : 'Remove'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Price Edit Modal */}
      {showPriceModal && tutorToEditPrice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Update Tutor Price</h3>
              <button
                onClick={() => {
                  setShowPriceModal(false)
                  setTutorToEditPrice(null)
                  setNewPrice('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Tutor: {tutorToEditPrice.user?.name}</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hourly Rate
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="Enter hourly rate"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  value={newCurrency}
                  onChange={(e) => setNewCurrency(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="GHS">GHS (Ghana Cedis)</option>
                  <option value="USD">USD (US Dollars)</option>
                  <option value="EUR">EUR (Euros)</option>
                  <option value="GBP">GBP (British Pounds)</option>
                  <option value="NGN">NGN (Nigerian Naira)</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleUpdatePrice}
                disabled={loading === tutorToEditPrice.id}
                className="flex-1 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50"
              >
                {loading === tutorToEditPrice.id ? 'Updating...' : 'Update Price'}
              </button>
              <button
                onClick={() => {
                  setShowPriceModal(false)
                  setTutorToEditPrice(null)
                  setNewPrice('')
                }}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Booking Modal */}
      {showScheduleModal && tutorToSchedule && (
        <AdminScheduleBooking
          tutor={tutorToSchedule}
          students={students}
          onClose={() => {
            setShowScheduleModal(false)
            setTutorToSchedule(null)
          }}
          onSuccess={() => {
            router.refresh()
            setShowScheduleModal(false)
            setTutorToSchedule(null)
          }}
        />
      )}
    </div>
  )
}

