'use client'

import { TrendingUp } from 'lucide-react'

interface Assignment {
  id: string
  title: string
  deadline: string
  status: 'PENDING' | 'COMPLETED' | 'OVERDUE'
  icon?: string
}

interface AssignmentsProps {
  assignments: Assignment[]
}

export default function Assignments({ assignments }: AssignmentsProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-50'
      case 'COMPLETED':
        return 'text-green-600 bg-green-50'
      case 'OVERDUE':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Assignment</h2>
        <span className="text-sm text-gray-500">Assignment system coming soon</span>
      </div>

      <div className="space-y-4">
        {assignments.map((assignment) => (
          <div
            key={assignment.id}
            className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
          >
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              {assignment.icon || assignment.title.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-800 truncate">{assignment.title}</h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-gray-500">Deadline: {assignment.deadline}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(
                    assignment.status
                  )}`}
                >
                  {assignment.status}
                </span>
              </div>
            </div>
            <TrendingUp className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
          </div>
        ))}
      </div>
    </div>
  )
}

