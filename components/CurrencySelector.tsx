'use client'

import { useState } from 'react'
import { getSupportedCurrencies, type CurrencyCode, DEFAULT_CURRENCY } from '@/lib/currency'

interface CurrencySelectorProps {
  value: CurrencyCode
  onChange: (currency: CurrencyCode) => void
  className?: string
}

export default function CurrencySelector({ value, onChange, className = '' }: CurrencySelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const currencies = getSupportedCurrencies()
  const selectedCurrency = currencies.find(c => c.code === value) || currencies.find(c => c.code === DEFAULT_CURRENCY)

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-left focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
      >
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="font-medium">{selectedCurrency?.symbol}</span>
            <span>{selectedCurrency?.code}</span>
            <span className="text-gray-500 text-sm">({selectedCurrency?.name})</span>
          </span>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
            {currencies.map((currency) => (
              <button
                key={currency.code}
                type="button"
                onClick={() => {
                  onChange(currency.code)
                  setIsOpen(false)
                }}
                className={`w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors ${
                  value === currency.code ? 'bg-pink-50 text-pink-600' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{currency.symbol}</span>
                  <span className="font-medium">{currency.code}</span>
                  <span className="text-gray-500 text-sm">{currency.name}</span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

