'use client'

import { useState, useEffect } from 'react'
import { DollarSign, Save, RefreshCw, AlertCircle, CheckCircle, Info } from 'lucide-react'
import { PRICING_LIMITS } from '@/lib/pricing-validation'

interface TutorPricing {
  academicInPersonPricePerTwoHours: number | null
  academicOnlinePricePerTwoHours: number | null
  professionalPricePerHour: number | null
}

export default function TutorPricingManagement() {
  const [pricing, setPricing] = useState<TutorPricing>({
    academicInPersonPricePerTwoHours: null,
    academicOnlinePricePerTwoHours: null,
    professionalPricePerHour: null,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchPricing()
  }, [])

  const fetchPricing = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/tutor/pricing', {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setPricing(data.pricing || {
          academicInPersonPricePerTwoHours: null,
          academicOnlinePricePerTwoHours: null,
          professionalPricePerHour: null,
        })
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to fetch pricing')
      }
    } catch (err) {
      console.error('Error fetching pricing:', err)
      setError('Failed to load pricing')
    } finally {
      setLoading(false)
    }
  }

  const validateField = (field: keyof TutorPricing, value: number | null): string => {
    if (value === null || value === undefined) return ''
    
    switch (field) {
      case 'academicInPersonPricePerTwoHours':
        if (value < 0) return 'Price cannot be negative'
        if (value > PRICING_LIMITS.academicInPersonMax) {
          return `Cannot exceed ₵${PRICING_LIMITS.academicInPersonMax} per 2 hours`
        }
        return ''
      case 'academicOnlinePricePerTwoHours':
        if (value < 0) return 'Price cannot be negative'
        if (value > PRICING_LIMITS.academicOnlineMax) {
          return `Cannot exceed ₵${PRICING_LIMITS.academicOnlineMax} per 2 hours`
        }
        return ''
      case 'professionalPricePerHour':
        if (value < PRICING_LIMITS.professionalMin) {
          return `Minimum is ₵${PRICING_LIMITS.professionalMin} per hour`
        }
        if (value > PRICING_LIMITS.professionalMax) {
          return `Maximum is ₵${PRICING_LIMITS.professionalMax} per hour`
        }
        return ''
      default:
        return ''
    }
  }

  const handleChange = (field: keyof TutorPricing, value: string) => {
    const numValue = value === '' ? null : parseFloat(value)
    setPricing(prev => ({ ...prev, [field]: numValue }))
    
    // Validate on change
    if (numValue !== null) {
      const error = validateField(field, numValue)
      setErrors(prev => ({ ...prev, [field]: error }))
    } else {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    
    // Validate all fields
    const newErrors: Record<string, string> = {}
    Object.keys(pricing).forEach((key) => {
      const field = key as keyof TutorPricing
      const value = pricing[field]
      if (value !== null) {
        const error = validateField(field, value)
        if (error) newErrors[field] = error
      }
    })
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setSaving(false)
      return
    }

    try {
      const response = await fetch('/api/tutor/pricing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(pricing),
      })

      if (response.ok) {
        setSuccess('Pricing updated successfully!')
        setTimeout(() => setSuccess(''), 3000)
        await fetchPricing()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update pricing')
        if (errorData.errors) {
          const errorMap: Record<string, string> = {}
          errorData.errors.forEach((err: string) => {
            // Try to match error to field
            if (err.includes('in-person')) {
              errorMap.academicInPersonPricePerTwoHours = err
            } else if (err.includes('online')) {
              errorMap.academicOnlinePricePerTwoHours = err
            } else if (err.includes('professional')) {
              errorMap.professionalPricePerHour = err
            }
          })
          setErrors(errorMap)
        }
      }
    } catch (err) {
      console.error('Error updating pricing:', err)
      setError('Failed to update pricing')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <RefreshCw className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading pricing settings...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-pink-600" />
              Manage Your Pricing
            </h2>
            <p className="text-gray-600 mt-2">
              Set your prices for different course types. Prices are subject to platform limits.
            </p>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Pricing Forms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Academic In-Person */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Academic - In-Person</h3>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
              Elementary & High School
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price per 2 Hours (₵)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₵</span>
                <input
                  type="number"
                  min="0"
                  max={PRICING_LIMITS.academicInPersonMax}
                  step="0.01"
                  value={pricing.academicInPersonPricePerTwoHours ?? ''}
                  onChange={(e) => handleChange('academicInPersonPricePerTwoHours', e.target.value)}
                  className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.academicInPersonPricePerTwoHours
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="0.00"
                />
              </div>
              {errors.academicInPersonPricePerTwoHours && (
                <p className="mt-1 text-sm text-red-600">{errors.academicInPersonPricePerTwoHours}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Maximum: ₵{PRICING_LIMITS.academicInPersonMax} per 2 hours
              </p>
            </div>
          </div>
        </div>

        {/* Academic Online */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Academic - Online</h3>
            <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">
              Elementary & High School
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price per 2 Hours (₵)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₵</span>
                <input
                  type="number"
                  min="0"
                  max={PRICING_LIMITS.academicOnlineMax}
                  step="0.01"
                  value={pricing.academicOnlinePricePerTwoHours ?? ''}
                  onChange={(e) => handleChange('academicOnlinePricePerTwoHours', e.target.value)}
                  className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.academicOnlinePricePerTwoHours
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-purple-500'
                  }`}
                  placeholder="0.00"
                />
              </div>
              {errors.academicOnlinePricePerTwoHours && (
                <p className="mt-1 text-sm text-red-600">{errors.academicOnlinePricePerTwoHours}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Maximum: ₵{PRICING_LIMITS.academicOnlineMax} per 2 hours
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Courses */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Professional Courses</h3>
          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
            Professional & Technical
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price per Hour (₵)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₵</span>
              <input
                type="number"
                min={PRICING_LIMITS.professionalMin}
                max={PRICING_LIMITS.professionalMax}
                step="0.01"
                value={pricing.professionalPricePerHour ?? ''}
                onChange={(e) => handleChange('professionalPricePerHour', e.target.value)}
                className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.professionalPricePerHour
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-green-500'
                }`}
                placeholder="0.00"
              />
            </div>
            {errors.professionalPricePerHour && (
              <p className="mt-1 text-sm text-red-600">{errors.professionalPricePerHour}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Range: ₵{PRICING_LIMITS.professionalMin} - ₵{PRICING_LIMITS.professionalMax} per hour
            </p>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900 mb-1">Pricing Guidelines</h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>
                <strong>Academic Courses (Elementary & High School):</strong>
                <ul className="ml-4 mt-1 space-y-0.5">
                  <li>In-Person: Maximum ₵{PRICING_LIMITS.academicInPersonMax} per 2 hours</li>
                  <li>Online: Maximum ₵{PRICING_LIMITS.academicOnlineMax} per 2 hours</li>
                </ul>
              </li>
              <li>
                <strong>Professional Courses:</strong> Range from ₵{PRICING_LIMITS.professionalMin} to ₵{PRICING_LIMITS.professionalMax} per hour
              </li>
              <li>If you don't set a price, the platform default will be used</li>
              <li>Prices apply to all course sections (subjects) within each category</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || Object.keys(errors).length > 0}
          className="px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Pricing
            </>
          )}
        </button>
      </div>
    </div>
  )
}

