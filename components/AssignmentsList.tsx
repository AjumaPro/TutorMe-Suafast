'use client'

import { useState } from 'react'
import { File, CheckCircle, Clock, XCircle, Download, Eye } from 'lucide-react'
import Link from 'next/link'
import AssignmentReviewModal from './AssignmentReviewModal'

interface Assignment {
  id: string
  title: string
  description?: string
  fileUrl?: string
  fileName?: string
  status: string
  feedback?: string
  grade?: string
  submittedAt: string
  reviewedAt?: string
  booking: {
    tutor?: {
      user: {
        name: string
      }
    }
    student?: {
      name: string
    }
  }
}

interface AssignmentsListProps {
  assignments: Assignment[]
  userRole: string
}

export default function AssignmentsList({ assignments, userRole }: AssignmentsListProps) {
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return 'bg-yellow-100 text-yellow-800'
      case 'REVIEWED':
        return 'bg-blue-100 text-blue-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return <Clock className="h-4 w-4" />
      case 'REVIEWED':
        return <Eye className="h-4 w-4" />
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  const handleReview = (assignment: Assignment) => {
    setSelectedAssignment(assignment)
    setShowReviewModal(true)
  }

  if (assignments.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-12 text-center">
        <File className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">No assignments</h3>
        <p className="text-gray-600">
          {userRole === 'PARENT'
            ? 'You haven\'t submitted any assignments yet'
            : 'No assignments have been submitted yet'}
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {assignments.map((assignment) => (
          <div
            key={assignment.id}
            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-800">{assignment.title}</h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(
                      assignment.status
                    )}`}
                  >
                    {getStatusIcon(assignment.status)}
                    {assignment.status}
                  </span>
                </div>

                {assignment.description && (
                  <p className="text-gray-600 mb-3">{assignment.description}</p>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>
                    {userRole === 'PARENT'
                      ? `Tutor: ${assignment.booking.tutor?.user.name || 'N/A'}`
                      : `Student: ${assignment.booking.student?.name || 'N/A'}`}
                  </span>
                  <span>
                    Submitted: {new Date(assignment.submittedAt).toLocaleDateString()}
                  </span>
                  {assignment.reviewedAt && (
                    <span>
                      Reviewed: {new Date(assignment.reviewedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {assignment.feedback && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 mb-1">Feedback:</p>
                    <p className="text-sm text-blue-800">{assignment.feedback}</p>
                  </div>
                )}

                {assignment.grade && (
                  <div className="mt-2">
                    <span className="text-sm font-medium text-gray-700">Grade: </span>
                    <span className="text-lg font-bold text-green-600">{assignment.grade}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                {assignment.fileUrl && (
                  <a
                    href={assignment.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </a>
                )}
                {userRole === 'TUTOR' && assignment.status === 'SUBMITTED' && (
                  <button
                    onClick={() => handleReview(assignment)}
                    className="px-3 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors text-sm font-medium"
                  >
                    Review
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showReviewModal && selectedAssignment && (
        <AssignmentReviewModal
          assignment={selectedAssignment}
          onClose={() => {
            setShowReviewModal(false)
            setSelectedAssignment(null)
          }}
          onSuccess={() => {
            setShowReviewModal(false)
            setSelectedAssignment(null)
            window.location.reload()
          }}
        />
      )}
    </>
  )
}

