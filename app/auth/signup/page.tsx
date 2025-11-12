'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, User, Phone, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface FieldErrors {
  name?: string
  email?: string
  phone?: string
  password?: string
  confirmPassword?: string
}

function SignUpForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const roleParam = searchParams.get('role')

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: roleParam === 'tutor' ? 'TUTOR' : 'PARENT',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [passwordStrength, setPasswordStrength] = useState(0)

  useEffect(() => {
    if (roleParam === 'tutor') {
      setFormData((prev) => ({ ...prev, role: 'TUTOR' }))
    }
  }, [roleParam])

  // Calculate password strength
  useEffect(() => {
    if (!formData.password) {
      setPasswordStrength(0)
      return
    }

    let strength = 0
    if (formData.password.length >= 8) strength++
    if (formData.password.length >= 12) strength++
    if (/[a-z]/.test(formData.password)) strength++
    if (/[A-Z]/.test(formData.password)) strength++
    if (/[0-9]/.test(formData.password)) strength++
    if (/[^a-zA-Z0-9]/.test(formData.password)) strength++

    setPasswordStrength(strength)
  }, [formData.password])

  // Format phone number
  const formatPhoneNumber = (value: string) => {
    const phoneNumber = value.replace(/\D/g, '')
    if (phoneNumber.length <= 3) return phoneNumber
    if (phoneNumber.length <= 6) return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`
    return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`
  }

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Name is required'
        if (value.trim().length < 2) return 'Name must be at least 2 characters'
        if (value.trim().length > 50) return 'Name must be less than 50 characters'
        return undefined
      case 'email':
        if (!value.trim()) return 'Email is required'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address'
        return undefined
      case 'phone':
        if (value && value.replace(/\D/g, '').length > 0 && value.replace(/\D/g, '').length < 10) {
          return 'Please enter a valid phone number'
        }
        return undefined
      case 'password':
        if (!value) return 'Password is required'
        if (value.length < 8) return 'Password must be at least 8 characters'
        return undefined
      case 'confirmPassword':
        if (!value) return 'Please confirm your password'
        if (value !== formData.password) return 'Passwords do not match'
        return undefined
      default:
        return undefined
    }
  }

  const handleBlur = (name: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }))
    const value = formData[name as keyof typeof formData]
    const error = validateField(name, value)
    setFieldErrors((prev) => ({ ...prev, [name]: error }))
  }

  const handleChange = (name: string, value: string) => {
    let processedValue = value

    // Format phone number
    if (name === 'phone') {
      processedValue = formatPhoneNumber(value)
    }

    setFormData((prev) => ({ ...prev, [name]: processedValue }))

    // Clear error when user starts typing
    if (fieldErrors[name as keyof FieldErrors]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name as keyof FieldErrors]
        return newErrors
      })
    }

    // Validate if field has been touched
    if (touched[name]) {
      const error = validateField(name, processedValue)
      setFieldErrors((prev) => ({ ...prev, [name]: error }))
    }

    // Special handling for confirm password
    if (name === 'password' && touched.confirmPassword) {
      const confirmError = validateField('confirmPassword', formData.confirmPassword)
      setFieldErrors((prev) => ({ ...prev, confirmPassword: confirmError }))
    }
  }

  const validateForm = () => {
    const errors: FieldErrors = {}
    let isValid = true

    Object.keys(formData).forEach((key) => {
      if (key !== 'phone' || formData.phone) {
        const error = validateField(key, formData[key as keyof typeof formData])
        if (error) {
          errors[key as keyof FieldErrors] = error
          isValid = false
        }
      }
    })

    setFieldErrors(errors)
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
      phone: formData.phone ? true : false,
    })

    return isValid
  }

  const getPasswordStrengthLabel = () => {
    if (passwordStrength === 0) return ''
    if (passwordStrength <= 2) return 'Weak'
    if (passwordStrength <= 4) return 'Fair'
    if (passwordStrength <= 5) return 'Good'
    return 'Strong'
  }

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 2) return 'bg-red-500'
    if (passwordStrength <= 4) return 'bg-yellow-500'
    if (passwordStrength <= 5) return 'bg-blue-500'
    return 'bg-green-500'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          role: formData.role,
          phone: formData.phone.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle field-specific errors from API
        if (data.details && Array.isArray(data.details)) {
          const apiErrors: FieldErrors = {}
          data.details.forEach((detail: { field: string; message: string }) => {
            apiErrors[detail.field as keyof FieldErrors] = detail.message
          })
          setFieldErrors(apiErrors)
        } else {
          setError(data.error || 'Failed to create account. Please try again.')
        }
        return
      }

      // Success - redirect to sign in with success message
      router.push('/auth/signin?registered=true&email=' + encodeURIComponent(formData.email))
    } catch (err) {
      console.error('Signup error:', err)
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-pink-600 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <User className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              href="/auth/signin"
              className="font-medium text-pink-600 hover:text-pink-700 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6 bg-white rounded-xl shadow-lg p-8" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-5">
            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className={`h-5 w-5 ${fieldErrors.name ? 'text-red-400' : 'text-gray-400'}`} />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className={`appearance-none block w-full pl-10 pr-3 py-2.5 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 sm:text-sm transition-all ${
                    fieldErrors.name
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : touched.name && !fieldErrors.name
                      ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                      : 'border-gray-300 focus:ring-pink-500 focus:border-pink-500'
                  }`}
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  onBlur={() => handleBlur('name')}
                  disabled={loading}
                />
                {touched.name && !fieldErrors.name && formData.name && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                )}
              </div>
              {fieldErrors.name && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  {fieldErrors.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className={`h-5 w-5 ${fieldErrors.email ? 'text-red-400' : 'text-gray-400'}`} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={`appearance-none block w-full pl-10 pr-3 py-2.5 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 sm:text-sm transition-all ${
                    fieldErrors.email
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : touched.email && !fieldErrors.email
                      ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                      : 'border-gray-300 focus:ring-pink-500 focus:border-pink-500'
                  }`}
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  disabled={loading}
                />
                {touched.email && !fieldErrors.email && formData.email && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                )}
              </div>
              {fieldErrors.email && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone <span className="text-gray-400 text-xs">(optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className={`h-5 w-5 ${fieldErrors.phone ? 'text-red-400' : 'text-gray-400'}`} />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  maxLength={12}
                  className={`appearance-none block w-full pl-10 pr-3 py-2.5 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 sm:text-sm transition-all ${
                    fieldErrors.phone
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : touched.phone && !fieldErrors.phone && formData.phone
                      ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                      : 'border-gray-300 focus:ring-pink-500 focus:border-pink-500'
                  }`}
                  placeholder="123-456-7890"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  onBlur={() => handleBlur('phone')}
                  disabled={loading}
                />
                {touched.phone && !fieldErrors.phone && formData.phone && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                )}
              </div>
              {fieldErrors.phone && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  {fieldErrors.phone}
                </p>
              )}
            </div>

            {/* Role */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1.5">
                I am a <span className="text-red-500">*</span>
              </label>
              <select
                id="role"
                name="role"
                className="block w-full px-3 py-2.5 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 sm:text-sm transition-all"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'PARENT' | 'TUTOR' })}
                disabled={loading}
              >
                <option value="PARENT">Parent/Student</option>
                <option value="TUTOR">Tutor</option>
              </select>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className={`h-5 w-5 ${fieldErrors.password ? 'text-red-400' : 'text-gray-400'}`} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className={`appearance-none block w-full pl-10 pr-10 py-2.5 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 sm:text-sm transition-all ${
                    fieldErrors.password
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : touched.password && !fieldErrors.password
                      ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                      : 'border-gray-300 focus:ring-pink-500 focus:border-pink-500'
                  }`}
                  placeholder="At least 8 characters"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  )}
                </button>
              </div>
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                        style={{ width: `${(passwordStrength / 6) * 100}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${
                      passwordStrength <= 2 ? 'text-red-600' :
                      passwordStrength <= 4 ? 'text-yellow-600' :
                      passwordStrength <= 5 ? 'text-blue-600' :
                      'text-green-600'
                    }`}>
                      {getPasswordStrengthLabel()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Must be at least 8 characters
                  </p>
                </div>
              )}
              {fieldErrors.password && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className={`h-5 w-5 ${fieldErrors.confirmPassword ? 'text-red-400' : 'text-gray-400'}`} />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className={`appearance-none block w-full pl-10 pr-10 py-2.5 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 sm:text-sm transition-all ${
                    fieldErrors.confirmPassword
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : touched.confirmPassword && !fieldErrors.confirmPassword && formData.confirmPassword
                      ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                      : 'border-gray-300 focus:ring-pink-500 focus:border-pink-500'
                  }`}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  onBlur={() => handleBlur('confirmPassword')}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  )}
                </button>
                {touched.confirmPassword && !fieldErrors.confirmPassword && formData.confirmPassword && (
                  <div className="absolute inset-y-0 right-10 pr-3 flex items-center pointer-events-none">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                )}
              </div>
              {fieldErrors.confirmPassword && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </span>
              ) : (
                'Create account'
              )}
            </button>
          </div>

          <p className="text-xs text-center text-gray-500">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </p>
        </form>
      </div>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SignUpForm />
    </Suspense>
  )
}
