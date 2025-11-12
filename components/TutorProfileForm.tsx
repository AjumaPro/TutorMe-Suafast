'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { parseJsonArray } from '@/lib/utils'

const profileSchema = z.object({
  bio: z.string().min(1, 'Bio is required'),
  subjects: z.array(z.string()).min(1, 'Select at least one subject'),
  grades: z.array(z.string()).min(1, 'Select at least one grade level'),
  experience: z.number().min(0).optional(),
  hourlyRate: z.number().min(0, 'Hourly rate must be positive'),
  credentials: z.string().url().optional().or(z.literal('')),
})

type ProfileFormData = z.infer<typeof profileSchema>

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

export default function TutorProfileForm({ tutorProfile }: any) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Parse subjects and grades from JSON strings if needed
  const initialSubjects = tutorProfile?.subjects
    ? parseJsonArray(tutorProfile.subjects)
    : []
  const initialGrades = tutorProfile?.grades ? parseJsonArray(tutorProfile.grades) : []

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      bio: tutorProfile?.bio || '',
      subjects: initialSubjects,
      grades: initialGrades,
      experience: tutorProfile?.experience || 0,
      hourlyRate: tutorProfile?.hourlyRate || 0,
      credentials: tutorProfile?.credentials || '',
    },
  })

  const selectedSubjects = watch('subjects') || []
  const selectedGrades = watch('grades') || []

  const toggleSubject = (subject: string) => {
    const current = selectedSubjects
    const updated = current.includes(subject)
      ? current.filter((s) => s !== subject)
      : [...current, subject]
    setValue('subjects', updated, { shouldValidate: true })
  }

  const toggleGrade = (grade: string) => {
    const current = selectedGrades
    const updated = current.includes(grade)
      ? current.filter((g) => g !== grade)
      : [...current, grade]
    setValue('grades', updated, { shouldValidate: true })
  }

  const onSubmit = async (data: ProfileFormData) => {
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const response = await fetch('/api/tutor/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update profile')
        return
      }

      setSuccess(true)
      router.refresh()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-green-700 font-medium">Profile updated successfully! Changes are saved.</p>
          </div>
        </div>
      )}

      {/* Bio */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Bio <span className="text-red-500">*</span>
        </label>
        <textarea
          {...register('bio')}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
          placeholder="Tell students about your teaching experience, approach, and what makes you a great tutor..."
        />
        {errors.bio && (
          <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>
        )}
      </div>

      {/* Subjects You Teach */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Subjects You Teach <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-3">
          {SUBJECTS.map((subject) => (
            <label
              key={subject}
              className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedSubjects.includes(subject)}
                onChange={() => toggleSubject(subject)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-sm text-gray-700">{subject}</span>
            </label>
          ))}
        </div>
        {errors.subjects && (
          <p className="mt-1 text-sm text-red-600">{errors.subjects.message}</p>
        )}
      </div>

      {/* Grade Levels */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Grade Levels <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-3">
          {GRADES.map((grade) => (
            <label
              key={grade}
              className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedGrades.includes(grade)}
                onChange={() => toggleGrade(grade)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-sm text-gray-700">{grade}</span>
            </label>
          ))}
        </div>
        {errors.grades && (
          <p className="mt-1 text-sm text-red-600">{errors.grades.message}</p>
        )}
      </div>

      {/* Years of Experience */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Years of Experience
        </label>
        <input
          type="number"
          {...register('experience', { valueAsNumber: true })}
          min="0"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="0"
        />
      </div>

      {/* Hourly Rate */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Hourly Rate ($) <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">
            $
          </span>
          <input
            type="number"
            step="0.01"
            min="0"
            {...register('hourlyRate', { valueAsNumber: true })}
            className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="0.00"
          />
        </div>
        {errors.hourlyRate && (
          <p className="mt-1 text-sm text-red-600">{errors.hourlyRate.message}</p>
        )}
      </div>

      {/* Credentials URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Credentials/Certifications URL (optional)
        </label>
        <input
          type="url"
          {...register('credentials')}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="https://example.com/certificate.pdf"
        />
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-gradient-to-r from-pink-600 to-pink-700 text-white px-8 py-3 rounded-lg hover:from-pink-700 hover:to-pink-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all shadow-md hover:shadow-lg"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Saving...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Save Profile Changes
            </>
          )}
        </button>
      </div>
    </form>
  )
}
