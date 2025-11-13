'use client'

import { useState } from 'react'
import { Smartphone, Mail, QrCode, Copy, CheckCircle, XCircle, Shield, Key, Phone } from 'lucide-react'

interface TwoFactorSetupProps {
  onComplete: () => void
  onCancel: () => void
}

export default function TwoFactorSetup({ onComplete, onCancel }: TwoFactorSetupProps) {
  const [method, setMethod] = useState<'TOTP' | 'EMAIL' | 'SMS' | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [manualEntryKey, setManualEntryKey] = useState<string | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [showBackupCodes, setShowBackupCodes] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [copied, setCopied] = useState(false)

  const handleMethodSelect = async (selectedMethod: 'TOTP' | 'EMAIL' | 'SMS') => {
    setMethod(selectedMethod)
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/two-factor/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: selectedMethod }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to setup 2FA')
        return
      }

      if (selectedMethod === 'TOTP') {
        setQrCodeUrl(result.qrCodeUrl)
        setManualEntryKey(result.manualEntryKey)
      } else if (selectedMethod === 'EMAIL') {
        setSuccess('Verification code sent to your email. Please check your inbox.')
      } else if (selectedMethod === 'SMS') {
        setSuccess(result.message || 'Verification code sent to your phone. Please check your messages.')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a 6-digit code')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/two-factor/verify-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: verificationCode,
          method,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Invalid verification code')
        return
      }

      // Show backup codes
      if (result.backupCodes) {
        setBackupCodes(result.backupCodes)
        setShowBackupCodes(true)
        setSuccess('Two-factor authentication enabled successfully!')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendEmail = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/two-factor/send-email-otp', {
        method: 'POST',
      })

      if (!response.ok) {
        const result = await response.json()
        setError(result.error || 'Failed to resend code')
        return
      }

      setSuccess('Verification code sent to your email')
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendSMS = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/two-factor/send-sms-otp', {
        method: 'POST',
      })

      if (!response.ok) {
        const result = await response.json()
        setError(result.error || 'Failed to resend code')
        return
      }

      const result = await response.json()
      setSuccess(result.message || 'Verification code sent to your phone')
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const copyBackupCodes = () => {
    const codesText = backupCodes.join('\n')
    navigator.clipboard.writeText(codesText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (showBackupCodes) {
    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-green-900">Backup Codes</h3>
          </div>
          <p className="text-sm text-green-800 mb-4">
            Save these backup codes in a safe place. You can use them to access your account if you lose access to your authenticator app or email.
          </p>
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <div className="grid grid-cols-2 gap-2 font-mono text-sm">
              {backupCodes.map((code, index) => (
                <div key={index} className="p-2 bg-gray-50 rounded text-center">
                  {code}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={copyBackupCodes}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center gap-2"
            >
              {copied ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Codes
                </>
              )}
            </button>
          </div>
        </div>
        <button
          onClick={onComplete}
          className="w-full px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 font-medium"
        >
          I&apos;ve Saved My Backup Codes
        </button>
      </div>
    )
  }

  if (!method) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <Shield className="h-5 w-5 text-pink-600" />
            Choose Two-Factor Authentication Method
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Select how you want to receive your verification codes
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => handleMethodSelect('TOTP')}
            disabled={loading}
            className="p-6 border-2 border-gray-200 rounded-lg hover:border-pink-500 hover:bg-pink-50 transition-all text-left disabled:opacity-50"
          >
            <div className="flex items-center gap-3 mb-2">
              <Smartphone className="h-6 w-6 text-pink-600" />
              <h4 className="font-semibold text-gray-800">Authenticator App</h4>
            </div>
            <p className="text-sm text-gray-600">
              Use an app like Google Authenticator, Authy, or Microsoft Authenticator
            </p>
          </button>

          <button
            onClick={() => handleMethodSelect('EMAIL')}
            disabled={loading}
            className="p-6 border-2 border-gray-200 rounded-lg hover:border-pink-500 hover:bg-pink-50 transition-all text-left disabled:opacity-50"
          >
            <div className="flex items-center gap-3 mb-2">
              <Mail className="h-6 w-6 text-pink-600" />
              <h4 className="font-semibold text-gray-800">Email</h4>
            </div>
            <p className="text-sm text-gray-600">
              Receive verification codes via email
            </p>
          </button>

          <button
            onClick={() => handleMethodSelect('SMS')}
            disabled={loading}
            className="p-6 border-2 border-gray-200 rounded-lg hover:border-pink-500 hover:bg-pink-50 transition-all text-left disabled:opacity-50"
          >
            <div className="flex items-center gap-3 mb-2">
              <Phone className="h-6 w-6 text-pink-600" />
              <h4 className="font-semibold text-gray-800">SMS</h4>
            </div>
            <p className="text-sm text-gray-600">
              Receive verification codes via text message
            </p>
          </button>
        </div>

        <button
          onClick={onCancel}
          className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <XCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          {success}
        </div>
      )}

      {method === 'TOTP' && qrCodeUrl && (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <QrCode className="h-5 w-5 text-pink-600" />
              Scan QR Code
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Scan this QR code with your authenticator app, then enter the 6-digit code to verify.
            </p>
            <div className="bg-white p-4 rounded-lg border border-gray-200 flex justify-center">
              <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
            </div>
          </div>

          {manualEntryKey && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Or enter this key manually:
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm">
                  {manualEntryKey}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(manualEntryKey)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {copied ? <CheckCircle className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {method === 'EMAIL' && (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <Mail className="h-5 w-5 text-pink-600" />
              Check Your Email
            </h3>
            <p className="text-sm text-gray-600">
              We&apos;ve sent a 6-digit verification code to your email address. Please enter it below.
            </p>
          </div>
          <button
            onClick={handleResendEmail}
            disabled={loading}
            className="text-sm text-pink-600 hover:text-pink-700"
          >
            Resend code
          </button>
        </div>
      )}

      {method === 'SMS' && (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <Phone className="h-5 w-5 text-pink-600" />
              Check Your Phone
            </h3>
            <p className="text-sm text-gray-600">
              We&apos;ve sent a 6-digit verification code to your phone number. Please enter it below.
            </p>
          </div>
          <button
            onClick={handleResendSMS}
            disabled={loading}
            className="text-sm text-pink-600 hover:text-pink-700"
          >
            Resend code
          </button>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Verification Code
        </label>
        <input
          type="text"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          maxLength={6}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-center text-2xl tracking-widest font-mono"
          disabled={loading}
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleVerify}
          disabled={loading || verificationCode.length !== 6}
          className="flex-1 px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 font-medium"
        >
          {loading ? 'Verifying...' : 'Verify & Enable'}
        </button>
        <button
          onClick={() => {
            setMethod(null)
            setQrCodeUrl(null)
            setManualEntryKey(null)
            setVerificationCode('')
            setError('')
            setSuccess('')
          }}
          disabled={loading}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Back
        </button>
      </div>
    </div>
  )
}

