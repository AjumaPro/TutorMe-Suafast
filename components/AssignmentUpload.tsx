'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, File, X, CheckCircle } from 'lucide-react'

interface AssignmentUploadProps {
  bookingId: string
  onUploadSuccess?: () => void
}

export default function AssignmentUpload({ bookingId, onUploadSuccess }: AssignmentUploadProps) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      // Limit file size to 10MB
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB')
        return
      }
      setFile(selectedFile)
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setUploading(true)

    if (!title.trim()) {
      setError('Title is required')
      setUploading(false)
      return
    }

    try {
      // In a real app, you would upload the file to S3/Cloudinary first
      // For now, we'll just create the assignment record
      // In production, implement file upload endpoint
      
      const fileUrl = file ? `/uploads/${file.name}` : undefined // Placeholder

      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          title: title.trim(),
          description: description.trim() || undefined,
          fileUrl,
          fileName: file?.name,
          fileSize: file?.size,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to submit assignment')
        return
      }

      setSuccess(true)
      setTitle('')
      setDescription('')
      setFile(null)
      
      // Refresh the page to show the new assignment
      router.refresh()
      
      // Call optional callback if provided
      if (onUploadSuccess) {
        onUploadSuccess()
      }

      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Submit Assignment</h3>

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
          <CheckCircle className="h-5 w-5" />
          <span>Assignment submitted successfully!</span>
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
            Assignment Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Math Homework - Chapter 5"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Add any additional notes or instructions..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload File (optional)
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-pink-400 transition-colors">
            <div className="space-y-1 text-center">
              {file ? (
                <div className="flex items-center justify-center gap-2 p-2 bg-gray-50 rounded">
                  <File className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-pink-600 hover:text-pink-500">
                      <span>Upload a file</span>
                      <input
                        type="file"
                        className="sr-only"
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PDF, DOC, DOCX, TXT, JPG, PNG (max 10MB)</p>
                </>
              )}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={uploading || !title.trim()}
          className="w-full px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 font-medium"
        >
          {uploading ? 'Submitting...' : 'Submit Assignment'}
        </button>
      </form>
    </div>
  )
}

