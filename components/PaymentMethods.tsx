'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Plus, Trash2, CheckCircle } from 'lucide-react'

interface PaymentMethod {
  id: string
  type: string
  last4: string
  brand: string
  expiryMonth: number
  expiryYear: number
  isDefault: boolean
}

export default function PaymentMethods() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    fetchPaymentMethods()
  }, [])

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('/api/settings/payment-methods')
      if (response.ok) {
        const data = await response.json()
        setPaymentMethods(data.paymentMethods || [])
      }
    } catch (err) {
      console.error('Failed to fetch payment methods:', err)
    }
  }

  const handleSetDefault = async (id: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/settings/payment-methods', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ methodId: id, action: 'setDefault' }),
      })

      if (response.ok) {
        fetchPaymentMethods()
      }
    } catch (err) {
      console.error('Failed to set default payment method:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/settings/payment-methods', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ methodId: id }),
      })

      if (response.ok) {
        fetchPaymentMethods()
      }
    } catch (err) {
      console.error('Failed to delete payment method:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2 flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-pink-600" />
          Payment Methods
        </h2>
        <p className="text-gray-600 text-sm">Manage your saved payment methods</p>
      </div>

      {/* Payment Methods List */}
      {paymentMethods.length === 0 ? (
        <div className="border border-gray-200 rounded-lg p-12 text-center">
          <CreditCard className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No payment methods</h3>
          <p className="text-gray-600 mb-4">Add a payment method to get started</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 font-medium inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Payment Method
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className="border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                  {method.brand.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-800">
                      {method.brand} •••• {method.last4}
                    </p>
                    {method.isDefault && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    Expires {method.expiryMonth}/{method.expiryYear}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!method.isDefault && (
                  <button
                    onClick={() => handleSetDefault(method.id)}
                    disabled={loading}
                    className="px-3 py-1 text-sm text-pink-600 hover:text-pink-700 font-medium"
                  >
                    Set as Default
                  </button>
                )}
                <button
                  onClick={() => handleDelete(method.id)}
                  disabled={loading}
                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={() => setShowAddForm(true)}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-pink-500 hover:bg-pink-50 transition-colors flex items-center justify-center gap-2 text-gray-700 font-medium"
          >
            <Plus className="h-5 w-5" />
            Add New Payment Method
          </button>
        </div>
      )}

      {/* Add Payment Method Form */}
      {showAddForm && (
        <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
          <h3 className="font-semibold text-gray-800 mb-4">Add Payment Method</h3>
          <p className="text-sm text-gray-600 mb-4">
            Payment method integration will be handled by Stripe. This is a placeholder for the payment form.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                // In production, this would open Stripe's payment method form
                alert('Payment method integration coming soon!')
                setShowAddForm(false)
              }}
              className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 font-medium"
            >
              Continue to Stripe
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

