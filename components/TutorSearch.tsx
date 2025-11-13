'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Star, MapPin, BookOpen } from 'lucide-react'
import { formatCurrency, parseCurrencyCode } from '@/lib/currency'

const SUBJECTS = [
  'Math', 'Science', 'English', 'History', 'Foreign Languages',
  'Computer Science', 'Art', 'Music', 'Test Prep', 'Other'
]

const GRADES = [
  'K-5', '6-8', '9-12', 'College', 'Adult'
]

export default function TutorSearch({ tutors, initialFilters }: any) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState({
    subject: initialFilters?.subject || '',
    grade: initialFilters?.grade || '',
    minRate: initialFilters?.minRate?.toString() || '',
    maxRate: initialFilters?.maxRate?.toString() || '',
  })

  // Helper function to parse JSON strings safely
  const parseArray = (value: any): string[] => {
    if (Array.isArray(value)) return value
    if (typeof value === 'string') {
      try {
        return JSON.parse(value)
      } catch {
        return []
      }
    }
    return []
  }

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)

    // Update URL with new filters
    const params = new URLSearchParams()
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.set(k, v)
    })
    router.push(`/search?${params.toString()}`)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Filters Sidebar */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <h2 className="text-lg font-semibold">Filters</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <select
              value={filters.subject}
              onChange={(e) => handleFilterChange('subject', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grade Level
            </label>
            <select
              value={filters.grade}
              onChange={(e) => handleFilterChange('grade', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hourly Rate
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.minRate}
                onChange={(e) => handleFilterChange('minRate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.maxRate}
                onChange={(e) => handleFilterChange('maxRate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="lg:col-span-3">
        <div className="mb-4">
          <p className="text-gray-600">
            Found {tutors.length} {tutors.length === 1 ? 'tutor' : 'tutors'}
          </p>
        </div>

        {tutors.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No tutors found
            </h3>
            <p className="text-gray-600">
              Try adjusting your filters to see more results.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {tutors.map((tutor: any) => (
              <div
                key={tutor.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl font-semibold text-primary-600">
                          {tutor.user.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold">{tutor.user.name}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-sm font-medium">
                            {tutor.rating.toFixed(1)} ({tutor.totalReviews} reviews)
                          </span>
                        </div>
                      </div>
                    </div>

                    {tutor.bio && (
                      <p className="text-gray-600 mb-3 line-clamp-2">{tutor.bio}</p>
                    )}

                    <div className="flex flex-wrap gap-2 mb-3">
                      {(() => {
                        const subjects = parseArray(tutor.subjects)
                        return (
                          <>
                            {subjects.slice(0, 3).map((subject: string) => (
                              <span
                                key={subject}
                                className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded"
                              >
                                {subject}
                              </span>
                            ))}
                            {subjects.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                +{subjects.length - 3} more
                              </span>
                            )}
                          </>
                        )
                      })()}
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-1" />
                        {parseArray(tutor.grades).join(', ')}
                      </span>
                      {tutor.experience && (
                        <span>{tutor.experience} years experience</span>
                      )}
                    </div>
                  </div>

                  <div className="ml-6 text-right">
                    <div className="mb-4">
                      <div className="text-2xl font-bold text-primary-600">
                        {formatCurrency(tutor.hourlyRate, parseCurrencyCode(tutor.currency))}
                      </div>
                      <span className="text-sm text-gray-500">per hour</span>
                    </div>
                    <Link
                      href={`/tutor/${tutor.id}/book`}
                      className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Book Lesson
                    </Link>
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

