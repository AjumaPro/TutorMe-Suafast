/**
 * Currency Configuration and Utilities
 * 
 * Default currency: Ghana Cedis (GHS)
 * Supports multi-currency for international tutors and students
 */

export type CurrencyCode = 'GHS' | 'USD' | 'EUR' | 'GBP' | 'NGN' | 'KES' | 'ZAR'

export interface Currency {
  code: CurrencyCode
  name: string
  symbol: string
  symbolPosition: 'before' | 'after'
  decimalPlaces: number
  locale: string
  // Smallest currency unit multiplier (e.g., 100 for GHS = pesewas)
  smallestUnit: number
}

export const DEFAULT_CURRENCY: CurrencyCode = 'GHS'

export const CURRENCIES: Record<CurrencyCode, Currency> = {
  GHS: {
    code: 'GHS',
    name: 'Ghana Cedis',
    symbol: '₵',
    symbolPosition: 'before',
    decimalPlaces: 2,
    locale: 'en-GH',
    smallestUnit: 100, // 1 GHS = 100 pesewas
  },
  USD: {
    code: 'USD',
    name: 'US Dollars',
    symbol: '$',
    symbolPosition: 'before',
    decimalPlaces: 2,
    locale: 'en-US',
    smallestUnit: 100, // 1 USD = 100 cents
  },
  EUR: {
    code: 'EUR',
    name: 'Euros',
    symbol: '€',
    symbolPosition: 'before',
    decimalPlaces: 2,
    locale: 'en-GB',
    smallestUnit: 100, // 1 EUR = 100 cents
  },
  GBP: {
    code: 'GBP',
    name: 'British Pounds',
    symbol: '£',
    symbolPosition: 'before',
    decimalPlaces: 2,
    locale: 'en-GB',
    smallestUnit: 100, // 1 GBP = 100 pence
  },
  NGN: {
    code: 'NGN',
    name: 'Nigerian Naira',
    symbol: '₦',
    symbolPosition: 'before',
    decimalPlaces: 2,
    locale: 'en-NG',
    smallestUnit: 100, // 1 NGN = 100 kobo
  },
  KES: {
    code: 'KES',
    name: 'Kenyan Shillings',
    symbol: 'KSh',
    symbolPosition: 'before',
    decimalPlaces: 2,
    locale: 'en-KE',
    smallestUnit: 100, // 1 KES = 100 cents
  },
  ZAR: {
    code: 'ZAR',
    name: 'South African Rand',
    symbol: 'R',
    symbolPosition: 'before',
    decimalPlaces: 2,
    locale: 'en-ZA',
    smallestUnit: 100, // 1 ZAR = 100 cents
  },
}

/**
 * Get currency configuration by code
 */
export function getCurrency(code: CurrencyCode = DEFAULT_CURRENCY): Currency {
  return CURRENCIES[code] || CURRENCIES[DEFAULT_CURRENCY]
}

/**
 * Format amount with currency symbol
 */
export function formatCurrency(
  amount: number,
  currencyCode: CurrencyCode = DEFAULT_CURRENCY,
  options?: {
    showSymbol?: boolean
    showCode?: boolean
  }
): string {
  const currency = getCurrency(currencyCode)
  const { showSymbol = true, showCode = false } = options || {}
  
  const formattedAmount = amount.toLocaleString(currency.locale, {
    minimumFractionDigits: currency.decimalPlaces,
    maximumFractionDigits: currency.decimalPlaces,
  })

  if (showCode) {
    return `${formattedAmount} ${currency.code}`
  }

  if (showSymbol) {
    if (currency.symbolPosition === 'before') {
      return `${currency.symbol}${formattedAmount}`
    } else {
      return `${formattedAmount} ${currency.symbol}`
    }
  }

  return formattedAmount
}

/**
 * Convert amount to smallest currency unit (for payment processing)
 * e.g., GHS 10.50 -> 1050 pesewas
 */
export function toSmallestUnit(
  amount: number,
  currencyCode: CurrencyCode = DEFAULT_CURRENCY
): number {
  const currency = getCurrency(currencyCode)
  return Math.round(amount * currency.smallestUnit)
}

/**
 * Convert from smallest currency unit to main unit
 * e.g., 1050 pesewas -> GHS 10.50
 */
export function fromSmallestUnit(
  amount: number,
  currencyCode: CurrencyCode = DEFAULT_CURRENCY
): number {
  const currency = getCurrency(currencyCode)
  return amount / currency.smallestUnit
}

/**
 * Get all supported currencies as array
 */
export function getSupportedCurrencies(): Currency[] {
  return Object.values(CURRENCIES)
}

/**
 * Check if currency code is supported
 */
export function isSupportedCurrency(code: string): code is CurrencyCode {
  return code in CURRENCIES
}

/**
 * Get currency code from string, defaulting to GHS if invalid
 */
export function parseCurrencyCode(code: string | null | undefined): CurrencyCode {
  if (!code) return DEFAULT_CURRENCY
  return isSupportedCurrency(code) ? code : DEFAULT_CURRENCY
}

