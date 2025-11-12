'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface AssignmentReviewModalProps {
  assignment: any
  onClose: () => void
  onSuccess: () => void
}

export default function AssignmentReviewModal({
  assignment,
  onClose,
  onSuccess,
}: AssignmentReviewModalProps) {
  const [feedback, setFeedback] = useState('')
  const [grade, setGrade] = useState('')
  const [status, setStatus] = useState<'REVIEWED' | 'COMPLETED'>('REVIEWED')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/assignments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: assignment.id,
          feedback: feedback.trim() || undefined,
          grade: grade.trim() || undefined,
          status,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to review assignment')
        return
      }

      onSuccess()
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Review Assignment</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">{assignment.title}</h3>
            {assignment.description && (
              <p className="text-gray-600 text-sm">{assignment.description}</p>
            )}
            {assignment.fileName && (
              <p className="text-sm text-gray-500 mt-2">
                File: {assignment.fileName}
              </p>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Feedback
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                placeholder="Provide feedback on the assignment..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grade (optional)
              </label>
              <input
                type="text"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                placeholder="e.g., A, 95, Pass"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-pink-500">
                  <input
                    type="radio"
                    value="REVIEWED"
                    checked={status === 'REVIEWED'}
                    onChange={(e) => setStatus(e.target.value as 'REVIEWED')}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium">Reviewed</div>
                    <div className="text-xs text-gray-500">Feedback provided</div>
                  </div>
                </label>
                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-pink-500">
                  <input
                    type="radio"
                    value="COMPLETED"
                    checked={status === 'COMPLETED'}
                    onChange={(e) => setStatus(e.target.value as 'COMPLETED')}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium">Completed</div>
                    <div className="text-xs text-gray-500">Fully graded</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 font-medium"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

