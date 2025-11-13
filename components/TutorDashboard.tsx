'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Star,
  MapPin,
  BookOpen,
  User,
  Search,
  Filter,
  GraduationCap,
  Award,
  CheckCircle,
  XCircle,
  Shield,
  Video,
  Monitor,
} from 'lucide-react'
import { formatCurrency, parseCurrencyCode } from '@/lib/currency'

const SUBJECTS = [
  'Math',
  'Science',
  'English',
  'History',
  'Foreign Languages',
  'Computer Science',
  'Art',
  'Music',
  'Test Prep',
  'Other',
]

const GRADES = ['K-5', '6-8', '9-12', 'College', 'Adult']

export default function TutorDashboard({ tutors, initialFilters, isAdmin = false }: any) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)
  const [adminFilter, setAdminFilter] = useState<'all' | 'pending' | 'approved'>('all')
  const [loading, setLoading] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    subject: initialFilters?.subject || '',
    grade: initialFilters?.grade || '',
    minRate: initialFilters?.minRate?.toString() || '',
    maxRate: initialFilters?.maxRate?.toString() || '',
    search: initialFilters?.search || '',
    lessonType: initialFilters?.lessonType || '',
  })

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)

    // Update URL with new filters
    const params = new URLSearchParams()
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.set(k, v)
    })
    router.push(`/tutors?${params.toString()}`)
  }

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

  const getAverageRating = (tutor: any) => {
    if (tutor.reviews && tutor.reviews.length > 0) {
      const sum = tutor.reviews.reduce((acc: number, review: any) => acc + review.rating, 0)
      return (sum / tutor.reviews.length).toFixed(1)
    }
    return tutor.rating?.toFixed(1) || '0.0'
  }

  const getTotalReviews = (tutor: any) => {
    return tutor.reviews?.length || tutor.totalReviews || 0
  }

  const handleApprove = async (tutorId: string, approve: boolean, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setLoading(tutorId)
    try {
      const response = await fetch(`/api/admin/tutors/${tutorId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: approve }),
      })

      if (response.ok) {
        router.refresh()
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

  // Helper function to get lesson types offered by tutor
  const getLessonTypes = (tutor: any): string[] => {
    if (tutor.bookings && tutor.bookings.length > 0) {
      const types = new Set(tutor.bookings.map((b: any) => b.lessonType))
      return Array.from(types) as string[]
    }
    // Default: assume both types are available if no bookings
    return ['ONLINE', 'IN_PERSON']
  }

  // Filter tutors by admin status filter and lesson type
  let displayTutors = tutors
  if (isAdmin && adminFilter !== 'all') {
    displayTutors = tutors.filter((tutor: any) => {
      if (adminFilter === 'pending') return !tutor.isApproved
      if (adminFilter === 'approved') return tutor.isApproved
      return true
    })
  }

  // Filter by lesson type
  if (filters.lessonType) {
    displayTutors = displayTutors.filter((tutor: any) => {
      const lessonTypes = getLessonTypes(tutor)
      return lessonTypes.includes(filters.lessonType)
    })
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tutors by name, subject, or bio..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="h-5 w-5" />
            Filters
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <select
                value={filters.subject}
                onChange={(e) => handleFilterChange('subject', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="">All Subjects</option>
                {SUBJECTS.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Grade Level</label>
              <select
                value={filters.grade}
                onChange={(e) => handleFilterChange('grade', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="">All Grades</option>
                {GRADES.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Lesson Type</label>
              <select
                value={filters.lessonType}
                onChange={(e) => handleFilterChange('lessonType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="">All Types</option>
                <option value="ONLINE">Online Only</option>
                <option value="IN_PERSON">In-Person Only</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hourly Rate</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minRate}
                  onChange={(e) => handleFilterChange('minRate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxRate}
                  onChange={(e) => handleFilterChange('maxRate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Admin Filter Toggle */}
      {isAdmin && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-pink-600" />
            <span className="font-medium text-gray-700">Admin View:</span>
            <div className="flex gap-2 ml-4">
              <button
                onClick={() => setAdminFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  adminFilter === 'all'
                    ? 'bg-pink-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setAdminFilter('pending')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  adminFilter === 'pending'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setAdminFilter('approved')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  adminFilter === 'approved'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Approved
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          Showing <span className="font-semibold text-gray-900">{displayTutors.length}</span>{' '}
          {displayTutors.length === 1 ? 'tutor' : 'tutors'}
        </p>
      </div>

      {/* Tutors Grid */}
      {displayTutors.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No tutors found</h3>
          <p className="text-gray-600">Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayTutors.map((tutor: any) => {
            const subjects = parseSubjects(tutor.subjects)
            const grades = parseGrades(tutor.grades)
            const averageRating = getAverageRating(tutor)
            const totalReviews = getTotalReviews(tutor)

            return (
              <div
                key={tutor.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group"
              >
                {/* Tutor Image/Avatar */}
                <div className="relative h-48 bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center overflow-hidden">
                  {tutor.user.image ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={tutor.user.image}
                        alt={tutor.user.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-4xl font-bold">
                      {tutor.user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {tutor.isVerified && (
                    <div className="absolute top-4 right-4 bg-blue-500 text-white p-2 rounded-full z-10">
                      <Award className="h-5 w-5" />
                    </div>
                  )}
                </div>

                {/* Tutor Info */}
                <div className="p-6">
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="text-xl font-bold text-gray-900">{tutor.user.name}</h3>
                      {isAdmin && (
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            tutor.isApproved
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {tutor.isApproved ? 'Approved' : 'Pending'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      <span className="font-semibold text-gray-900">{averageRating}</span>
                      <span className="text-gray-500">({totalReviews} reviews)</span>
                    </div>
                  </div>

                  {tutor.bio && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{tutor.bio}</p>
                  )}

                  {/* Lesson Types */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getLessonTypes(tutor).map((type) => (
                        <span
                          key={type}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                            type === 'ONLINE'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {type === 'ONLINE' ? (
                            <>
                              <Video className="h-3 w-3" />
                              Online
                            </>
                          ) : (
                            <>
                              <MapPin className="h-3 w-3" />
                              In-Person
                            </>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Subjects */}
                  {subjects.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                        <BookOpen className="h-4 w-4" />
                        <span>Subjects</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {subjects.slice(0, 3).map((subject: string) => (
                          <span
                            key={subject}
                            className="px-2 py-1 bg-pink-100 text-pink-700 text-xs rounded-full font-medium"
                          >
                            {subject}
                          </span>
                        ))}
                        {subjects.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">
                            +{subjects.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Grades */}
                  {grades.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                        <GraduationCap className="h-4 w-4" />
                        <span>Grade Levels</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {grades.map((grade: string) => (
                          <span
                            key={grade}
                            className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium"
                          >
                            {grade}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Location */}
                  {tutor.city && tutor.state && (
                    <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>
                        {tutor.city}, {tutor.state}
                        {tutor.zipCode && ` ${tutor.zipCode}`}
                      </span>
                    </div>
                  )}

                  {/* Experience and Rate */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div>
                      {tutor.experience && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">{tutor.experience} years</span> experience
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-pink-600">
                        {formatCurrency(tutor.hourlyRate, parseCurrencyCode(tutor.currency))}
                      </div>
                      <span className="text-xs text-gray-500">per hour</span>
                    </div>
                  </div>

                  {/* Admin Controls or Book Button */}
                  {isAdmin ? (
                    <div className="mt-4 space-y-2">
                      {!tutor.isApproved && (
                        <button
                          onClick={(e) => handleApprove(tutor.id, true, e)}
                          disabled={loading === tutor.id}
                          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          {loading === tutor.id ? 'Processing...' : 'Approve Tutor'}
                        </button>
                      )}
                      {tutor.isApproved && (
                        <button
                          onClick={(e) => handleApprove(tutor.id, false, e)}
                          disabled={loading === tutor.id}
                          className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                        >
                          <XCircle className="h-4 w-4" />
                          {loading === tutor.id ? 'Processing...' : 'Revoke Approval'}
                        </button>
                      )}
                      <Link
                        href={`/tutor/${tutor.id}/book`}
                        className="w-full block text-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium"
                      >
                        View Profile
                      </Link>
                    </div>
                  ) : (
                    tutor.isApproved && (
                      <Link
                        href={`/tutor/${tutor.id}/book`}
                        className="mt-4 w-full block text-center px-4 py-2 bg-gradient-to-r from-pink-600 to-pink-700 text-white rounded-lg hover:from-pink-700 hover:to-pink-800 transition-all font-medium"
                      >
                        Book Lesson
                      </Link>
                    )
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

