'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'

export default function AccountActions() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')

  const handleDeactivate = async () => {
    if (!confirm('Are you sure you want to deactivate your account? You can reactivate it later by logging in.')) {
      return
    }

    setLoading('deactivate')
    try {
      const response = await fetch('/api/settings/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DEACTIVATE' }),
      })

      const result = await response.json()

      if (response.ok) {
        alert('Account deactivated successfully')
        signOut({ callbackUrl: '/auth/signin' })
      } else {
        alert(result.error || 'Failed to deactivate account')
      }
    } catch (err) {
      console.error('Error deactivating account:', err)
      alert('An error occurred. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const handleDelete = async () => {
    if (!deletePassword) {
      alert('Please enter your password to confirm account deletion')
      return
    }

    if (!confirm('WARNING: This action cannot be undone. All your data will be permanently deleted. Are you absolutely sure?')) {
      return
    }

    setLoading('delete')
    try {
      const response = await fetch('/api/settings/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DELETE',
          confirmPassword: deletePassword,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        alert('Account deleted successfully')
        signOut({ callbackUrl: '/' })
      } else {
        alert(result.error || 'Failed to delete account')
        setDeletePassword('')
      }
    } catch (err) {
      console.error('Error deleting account:', err)
      alert('An error occurred. Please try again.')
    } finally {
      setLoading(null)
      setShowDeleteConfirm(false)
      setDeletePassword('')
    }
  }

  return (
    <>
      <button
        onClick={handleDeactivate}
        disabled={loading !== null}
        className="w-full px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-left disabled:opacity-50"
      >
        {loading === 'deactivate' ? 'Processing...' : 'Deactivate Account'}
      </button>

      {!showDeleteConfirm ? (
        <button
          onClick={() => setShowDeleteConfirm(true)}
          disabled={loading !== null}
          className="w-full px-4 py-2 border border-red-500 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-left font-medium disabled:opacity-50"
        >
          Delete Account
        </button>
      ) : (
        <div className="space-y-2">
          <input
            type="password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            placeholder="Enter your password to confirm"
            className="w-full px-4 py-2 border border-red-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={loading !== null || !deletePassword}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-medium"
            >
              {loading === 'delete' ? 'Deleting...' : 'Confirm Delete'}
            </button>
            <button
              onClick={() => {
                setShowDeleteConfirm(false)
                setDeletePassword('')
              }}
              disabled={loading !== null}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  )
}

