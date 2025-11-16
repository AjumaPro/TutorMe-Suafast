'use client'

import { DollarSign, TrendingUp, TrendingDown, Wallet, CreditCard } from 'lucide-react'
import Link from 'next/link'

interface EarningsSummaryProps {
  totalEarnings: number
  thisMonth: number
  lastMonth: number
  pendingPayout: number
  currency?: string
}

export default function EarningsSummary({
  totalEarnings,
  thisMonth,
  lastMonth,
  pendingPayout,
  currency = '₵',
}: EarningsSummaryProps) {
  const monthlyChange = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0
  const isPositive = monthlyChange >= 0

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow-md p-6 border border-green-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Wallet className="h-5 w-5 text-green-600" />
          Earnings Summary
        </h3>
        <Link href="/tutor/earnings" className="text-sm text-green-600 hover:text-green-700 font-medium">
          View Details
        </Link>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">Total Earnings</p>
          <p className="text-3xl font-bold text-gray-900">
            {currency}
            {totalEarnings.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">This Month</p>
            <p className="text-lg font-semibold text-gray-900">
              {currency}
              {thisMonth.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className="flex items-center gap-1 mt-1">
              {isPositive ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={`text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(monthlyChange).toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Pending</p>
            <p className="text-lg font-semibold text-gray-900">
              {currency}
              {pendingPayout.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <Link
              href="/tutor/dashboard?tab=payments"
              className="text-xs text-green-600 hover:text-green-700 mt-1 inline-block"
            >
              View Payments
            </Link>
          </div>
        </div>

        <Link
          href="/tutor/earnings"
          className="block w-full bg-green-600 text-white text-center py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
        >
          <CreditCard className="h-4 w-4" />
          View Payment History
        </Link>
      </div>
    </div>
  )
}

