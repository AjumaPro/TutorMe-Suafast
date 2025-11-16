'use client'

import { useState, useEffect } from 'react'
import { DollarSign, Save, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'

interface PricingRule {
  id: string
  lessonType: 'IN_PERSON' | 'ONLINE'
  pricePerTwoHours: number
  currency: string
  isActive: boolean
}

export default function AdminPricingPanel() {
  const [rules, setRules] = useState<PricingRule[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    IN_PERSON: 50,
    ONLINE: 30,
  })

  useEffect(() => {
    fetchPricingRules()
  }, [])

  const fetchPricingRules = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/pricing', {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        const fetchedRules = data.rules || []
        setRules(fetchedRules)

        // Update form data with fetched rules
        fetchedRules.forEach((rule: PricingRule) => {
          if (rule.lessonType === 'IN_PERSON') {
            setFormData(prev => ({ ...prev, IN_PERSON: rule.pricePerTwoHours }))
          } else if (rule.lessonType === 'ONLINE') {
            setFormData(prev => ({ ...prev, ONLINE: rule.pricePerTwoHours }))
          }
        })
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        const errorMessage = errorData.error || `Failed to fetch pricing rules (${response.status})`
        console.error('Pricing rules fetch error:', errorMessage, response.status)
        setError(errorMessage)
        
        // If table doesn't exist, show helpful message
        if (response.status === 500) {
          console.warn('Pricing rules table might not exist. Check database setup.')
        }
      }
    } catch (err) {
      console.error('Error fetching pricing rules:', err)
      setError(`Failed to load pricing rules: ${err instanceof Error ? err.message : 'Network error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (lessonType: 'IN_PERSON' | 'ONLINE') => {
    setSaving(lessonType)
    setError('')
    setSuccess('')

    const pricePerTwoHours = formData[lessonType]

    if (pricePerTwoHours < 0) {
      setError('Price must be positive')
      setSaving(null)
      return
    }

    try {
      const response = await fetch('/api/admin/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          lessonType,
          pricePerTwoHours,
          currency: 'GHS',
          isActive: true,
        }),
      })

      if (response.ok) {
        setSuccess(`${lessonType === 'IN_PERSON' ? 'In-Person' : 'Online'} pricing updated successfully!`)
        setTimeout(() => setSuccess(''), 3000)
        await fetchPricingRules()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update pricing')
      }
    } catch (err) {
      console.error('Error updating pricing:', err)
      setError('Failed to update pricing')
    } finally {
      setSaving(null)
    }
  }

  const calculateExamplePrice = (duration: number, lessonType: 'IN_PERSON' | 'ONLINE') => {
    const pricePerTwoHours = formData[lessonType]
    return ((pricePerTwoHours * duration) / 120).toFixed(2)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <RefreshCw className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading pricing rules...</p>
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
              Pricing Rules Configuration
            </h2>
            <p className="text-gray-600 mt-2">
              Set the pricing for course sections. Prices are calculated per 2-hour blocks.
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

      {/* Pricing Rules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* In-Person Pricing */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">In-Person Lessons</h3>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
              IN_PERSON
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
                  step="0.01"
                  value={formData.IN_PERSON}
                  onChange={(e) =>
                    setFormData(prev => ({
                      ...prev,
                      IN_PERSON: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                This is the price for a 2-hour lesson
              </p>
            </div>

            {/* Price Examples */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Price Examples:</p>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>1 hour (60 min):</span>
                  <span className="font-semibold">₵{calculateExamplePrice(60, 'IN_PERSON')}</span>
                </div>
                <div className="flex justify-between">
                  <span>2 hours (120 min):</span>
                  <span className="font-semibold">₵{calculateExamplePrice(120, 'IN_PERSON')}</span>
                </div>
                <div className="flex justify-between">
                  <span>3 hours (180 min):</span>
                  <span className="font-semibold">₵{calculateExamplePrice(180, 'IN_PERSON')}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleSave('IN_PERSON')}
              disabled={saving === 'IN_PERSON'}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving === 'IN_PERSON' ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save In-Person Pricing
                </>
              )}
            </button>
          </div>
        </div>

        {/* Online Pricing */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Online Lessons</h3>
            <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">
              ONLINE
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
                  step="0.01"
                  value={formData.ONLINE}
                  onChange={(e) =>
                    setFormData(prev => ({
                      ...prev,
                      ONLINE: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                This is the price for a 2-hour lesson
              </p>
            </div>

            {/* Price Examples */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Price Examples:</p>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>1 hour (60 min):</span>
                  <span className="font-semibold">₵{calculateExamplePrice(60, 'ONLINE')}</span>
                </div>
                <div className="flex justify-between">
                  <span>2 hours (120 min):</span>
                  <span className="font-semibold">₵{calculateExamplePrice(120, 'ONLINE')}</span>
                </div>
                <div className="flex justify-between">
                  <span>3 hours (180 min):</span>
                  <span className="font-semibold">₵{calculateExamplePrice(180, 'ONLINE')}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleSave('ONLINE')}
              disabled={saving === 'ONLINE'}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving === 'ONLINE' ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Online Pricing
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900 mb-1">How Pricing Works</h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>These are default platform prices for academic courses (Elementary & High School)</li>
              <li>Prices are set per 2-hour blocks (120 minutes)</li>
              <li>For shorter or longer lessons, the price is calculated proportionally</li>
              <li>Example: If 2 hours = ₵50, then 1 hour = ₵25, 3 hours = ₵75</li>
              <li><strong>Tutor Pricing Limits:</strong></li>
              <li className="ml-4">• Academic In-Person: Max ₵50 per 2 hours</li>
              <li className="ml-4">• Academic Online: Max ₵30 per 2 hours</li>
              <li className="ml-4">• Professional Courses: ₵50-₵100 per hour (tutors set their own)</li>
              <li>Tutors can set custom prices within these limits at /tutor/pricing</li>
              <li>If tutors don't set prices, these defaults are used</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

