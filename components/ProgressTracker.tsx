'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Award, Target, BarChart3 } from 'lucide-react'

interface ProgressEntry {
  id: string
  subject: string
  topic?: string
  score?: number
  notes?: string
  milestone?: string
  createdAt: string
}

interface ProgressTrackerProps {
  studentId?: string
  tutorId?: string
}

export default function ProgressTracker({ studentId, tutorId }: ProgressTrackerProps) {
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSubject, setSelectedSubject] = useState<string>('all')

  useEffect(() => {
    fetchProgress()
  }, [studentId, tutorId, selectedSubject])

  const fetchProgress = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (studentId) params.set('studentId', studentId)
      if (selectedSubject !== 'all') params.set('subject', selectedSubject)

      const response = await fetch(`/api/progress?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setProgressEntries(data.progressEntries || [])
        setStats(data.stats || null)
      }
    } catch (err) {
      console.error('Failed to fetch progress:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 text-center">
        <p className="text-gray-600">Loading progress...</p>
      </div>
    )
  }

  const subjects = stats?.subjects || []

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Total Entries</span>
              <BarChart3 className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalEntries}</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Average Score</span>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.averageScore ? stats.averageScore.toFixed(1) : 'N/A'}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Subjects</span>
              <Target className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{subjects.length}</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Milestones</span>
              <Award className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.milestones}</p>
          </div>
        </div>
      )}

      {/* Subject Filter */}
      {subjects.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-700">Filter by subject:</span>
            <button
              onClick={() => setSelectedSubject('all')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                selectedSubject === 'all'
                  ? 'bg-pink-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {subjects.map((subject: string) => (
              <button
                key={subject}
                onClick={() => setSelectedSubject(subject)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  selectedSubject === subject
                    ? 'bg-pink-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {subject}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Progress Entries */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Progress History</h3>

        {progressEntries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No progress entries yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {progressEntries.map((entry) => (
              <div
                key={entry.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-800">{entry.subject}</h4>
                    {entry.topic && (
                      <p className="text-sm text-gray-600 mt-1">Topic: {entry.topic}</p>
                    )}
                  </div>
                  {entry.score !== null && entry.score !== undefined && (
                    <div className="text-right">
                      <div className="text-2xl font-bold text-pink-600">{entry.score}</div>
                      <div className="text-xs text-gray-500">Score</div>
                    </div>
                  )}
                </div>

                {entry.notes && (
                  <p className="text-sm text-gray-700 mt-2">{entry.notes}</p>
                )}

                {entry.milestone && (
                  <div className="mt-3 flex items-center gap-2">
                    <Award className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium text-yellow-700">
                      Milestone: {entry.milestone}
                    </span>
                  </div>
                )}

                <p className="text-xs text-gray-400 mt-3">
                  {new Date(entry.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

