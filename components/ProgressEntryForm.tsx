'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TrendingUp } from 'lucide-react'

interface ProgressEntryFormProps {
  bookingId: string
  studentId: string
  tutorId: string
  subject: string
  onSuccess?: () => void
}

export default function ProgressEntryForm({
  bookingId,
  studentId,
  tutorId,
  subject,
  onSuccess,
}: ProgressEntryFormProps) {
  const router = useRouter()
  const [topic, setTopic] = useState('')
  const [score, setScore] = useState('')
  const [notes, setNotes] = useState('')
  const [milestone, setMilestone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          tutorId,
          bookingId,
          subject,
          topic: topic.trim() || undefined,
          score: score ? parseFloat(score) : undefined,
          notes: notes.trim() || undefined,
          milestone: milestone.trim() || undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to add progress entry')
        return
      }

      setSuccess(true)
      setTopic('')
      setScore('')
      setNotes('')
      setMilestone('')

      // Refresh the page to show the new progress entry
      router.refresh()

      // Call optional callback if provided
      if (onSuccess) {
        setTimeout(() => {
          onSuccess()
        }, 1500)
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-pink-600" />
        <h3 className="text-lg font-semibold text-gray-800">Add Progress Entry</h3>
      </div>

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
          Progress entry added successfully!
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Topic Covered (optional)
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Linear Equations, Essay Writing"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Score (0-100, optional)
          </label>
          <input
            type="number"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            min="0"
            max="100"
            placeholder="e.g., 85"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Add notes about the student's progress..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Milestone (optional)
          </label>
          <input
            type="text"
            value={milestone}
            onChange={(e) => setMilestone(e.target.value)}
            placeholder="e.g., Mastered Algebra Basics"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 font-medium"
        >
          {submitting ? 'Adding...' : 'Add Progress Entry'}
        </button>
      </form>
    </div>
  )
}

