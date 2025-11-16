'use client'

import { useState, useEffect } from 'react'
import { Wallet, DollarSign, Calendar, AlertCircle, CheckCircle, Info } from 'lucide-react'

const MINIMUM_WITHDRAWAL_AMOUNT = 100 // 100 GHS

interface WithdrawalRequestFormProps {
  availableBalance: number
  currency?: string
  onSuccess?: () => void
}

export default function WithdrawalRequestForm({
  availableBalance,
  currency = '₵',
  onSuccess,
}: WithdrawalRequestFormProps) {
  const [amount, setAmount] = useState('')
  const [frequency, setFrequency] = useState<'WEEKLY' | 'MONTHLY'>('WEEKLY')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [accountDetails, setAccountDetails] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    const amountNum = parseFloat(amount)

    if (isNaN(amountNum) || amountNum < MINIMUM_WITHDRAWAL_AMOUNT) {
      setError(`Minimum withdrawal amount is ${MINIMUM_WITHDRAWAL_AMOUNT} ${currency}`)
      setLoading(false)
      return
    }

    if (amountNum > availableBalance) {
      setError(`Amount exceeds available balance of ${currency}${availableBalance.toFixed(2)}`)
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/tutor/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          amount: amountNum,
          frequency,
          paymentMethod: paymentMethod || undefined,
          accountDetails: accountDetails || undefined,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Withdrawal request submitted successfully!')
        setAmount('')
        setPaymentMethod('')
        setAccountDetails('')
        if (onSuccess) {
          setTimeout(() => {
            onSuccess()
          }, 2000)
        }
      } else {
        setError(data.error || 'Failed to submit withdrawal request')
      }
    } catch (err) {
      console.error('Error submitting withdrawal:', err)
      setError('Failed to submit withdrawal request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-100 rounded-lg">
          <Wallet className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Request Withdrawal</h2>
          <p className="text-sm text-gray-600">Withdraw your earnings to your account</p>
        </div>
      </div>

      {/* Available Balance */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Available Balance</p>
            <p className="text-2xl font-bold text-green-600">
              {currency}{availableBalance.toFixed(2)}
            </p>
          </div>
          <DollarSign className="h-8 w-8 text-green-600" />
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Withdrawal Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Withdrawal Amount ({currency})
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              {currency}
            </span>
            <input
              type="number"
              min={MINIMUM_WITHDRAWAL_AMOUNT}
              max={availableBalance}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder={`Minimum ${MINIMUM_WITHDRAWAL_AMOUNT}`}
              required
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Minimum: {currency}{MINIMUM_WITHDRAWAL_AMOUNT}.00
          </p>
        </div>

        {/* Frequency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Withdrawal Frequency
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setFrequency('WEEKLY')}
              className={`p-4 border-2 rounded-lg transition-colors ${
                frequency === 'WEEKLY'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Calendar className="h-5 w-5 mx-auto mb-2 text-gray-600" />
              <p className="font-medium text-gray-800">Weekly</p>
              <p className="text-xs text-gray-500 mt-1">Once per week</p>
            </button>
            <button
              type="button"
              onClick={() => setFrequency('MONTHLY')}
              className={`p-4 border-2 rounded-lg transition-colors ${
                frequency === 'MONTHLY'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Calendar className="h-5 w-5 mx-auto mb-2 text-gray-600" />
              <p className="font-medium text-gray-800">Monthly</p>
              <p className="text-xs text-gray-500 mt-1">Once per month</p>
            </button>
          </div>
        </div>

        {/* Payment Method (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Method <span className="text-gray-500">(Optional)</span>
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Select payment method</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="MOBILE_MONEY">Mobile Money</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        {/* Account Details (Optional) */}
        {paymentMethod && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Details <span className="text-gray-500">(Optional)</span>
            </label>
            <textarea
              value={accountDetails}
              onChange={(e) => setAccountDetails(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter account number, mobile money number, or other payment details"
            />
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1 text-sm text-blue-800">
              <p className="font-medium mb-1">Withdrawal Guidelines:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Minimum withdrawal: {currency}{MINIMUM_WITHDRAWAL_AMOUNT}.00</li>
                <li>Weekly withdrawals: One request per week</li>
                <li>Monthly withdrawals: One request per month</li>
                <li>Processing time: 3-5 business days after approval</li>
                <li>Withdrawals are subject to admin approval</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !amount || parseFloat(amount) < MINIMUM_WITHDRAWAL_AMOUNT || parseFloat(amount) > availableBalance}
          className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Submitting...
            </>
          ) : (
            <>
              <Wallet className="h-4 w-4" />
              Request Withdrawal
            </>
          )}
        </button>
      </form>
    </div>
  )
}

