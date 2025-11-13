'use client'

import { useState, useEffect } from 'react'
import { Smartphone, Mail, Key, XCircle, RefreshCw, Phone } from 'lucide-react'

interface TwoFactorVerificationProps {
  method: 'TOTP' | 'EMAIL' | 'SMS'
  email: string
  phone?: string
  onVerify: (code: string, isBackupCode?: boolean) => Promise<void>
  onResend?: () => Promise<void>
  onCancel?: () => void
}

export default function TwoFactorVerification({
  method,
  email,
  phone,
  onVerify,
  onResend,
  onCancel,
}: TwoFactorVerificationProps) {
  const [code, setCode] = useState('')
  const [isBackupCode, setIsBackupCode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if ((method === 'EMAIL' || method === 'SMS') && onResend) {
      // Auto-send OTP on mount
      onResend()
      setResendCooldown(60) // 60 second cooldown
    }
  }, [method, onResend])

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!code || (isBackupCode ? code.length < 8 : code.length !== 6)) {
      setError(isBackupCode ? 'Backup code must be at least 8 characters' : 'Please enter a 6-digit code')
      return
    }

    setLoading(true)
    try {
      await onVerify(code, isBackupCode)
    } catch (err: any) {
      setError(err.message || 'Invalid verification code')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0 || !onResend) return

    setLoading(true)
    setError('')
    try {
      await onResend()
      setResendCooldown(60)
    } catch (err: any) {
      setError(err.message || 'Failed to resend code')
    } finally {
      setLoading(false)
    }
  }

  const maskedEmail = email ? `${email.slice(0, 2)}***@${email.split('@')[1]}` : 'your email'
  const maskedPhone = phone ? phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) ***-$3') : 'your phone'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Two-Factor Authentication</h2>
        <p className="text-gray-600">
          {method === 'TOTP'
            ? 'Enter the 6-digit code from your authenticator app'
            : method === 'EMAIL'
            ? `Enter the 6-digit code sent to ${maskedEmail}`
            : `Enter the 6-digit code sent to ${maskedPhone}`}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <XCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {isBackupCode ? 'Backup Code' : 'Verification Code'}
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '')
              setCode(isBackupCode ? value.slice(0, 16) : value.slice(0, 6))
            }}
            placeholder={isBackupCode ? 'Enter backup code' : '000000'}
            maxLength={isBackupCode ? 16 : 6}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-center text-2xl tracking-widest font-mono"
            disabled={loading}
            autoFocus
          />
        </div>

        {(method === 'EMAIL' || method === 'SMS') && onResend && (
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleResend}
              disabled={loading || resendCooldown > 0}
              className="text-sm text-pink-600 hover:text-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${resendCooldown > 0 ? 'animate-spin' : ''}`} />
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
            </button>
          </div>
        )}

        <div className="pt-2">
          <button
            type="button"
            onClick={() => setIsBackupCode(!isBackupCode)}
            className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-2"
          >
            <Key className="h-4 w-4" />
            {isBackupCode ? 'Use verification code instead' : 'Use backup code instead'}
          </button>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading || (isBackupCode ? code.length < 8 : code.length !== 6)}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all"
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          {method === 'TOTP' ? (
            <>
              <Smartphone className="h-3 w-3 inline mr-1" />
              Open your authenticator app to get the code
            </>
          ) : method === 'EMAIL' ? (
            <>
              <Mail className="h-3 w-3 inline mr-1" />
              Check your email inbox for the verification code
            </>
          ) : (
            <>
              <Phone className="h-3 w-3 inline mr-1" />
              Check your phone messages for the verification code
            </>
          )}
        </p>
      </div>
    </div>
  )
}

