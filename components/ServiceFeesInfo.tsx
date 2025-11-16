'use client'

import { DollarSign, Calculator, Info, TrendingUp, Percent, Receipt } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'

const SERVICE_FEE_PERCENTAGE = 0.20 // 20%

interface ServiceFeesInfoProps {
  showExamples?: boolean
  compact?: boolean
}

export default function ServiceFeesInfo({ showExamples = true, compact = false }: ServiceFeesInfoProps) {
  const examples = [
    { bookingPrice: 50, description: '1-hour academic lesson' },
    { bookingPrice: 100, description: '2-hour academic lesson' },
    { bookingPrice: 150, description: '3-hour professional course' },
    { bookingPrice: 200, description: '4-hour professional course' },
  ]

  const calculateFee = (price: number) => {
    const fee = price * SERVICE_FEE_PERCENTAGE
    const payout = price - fee
    return { fee, payout }
  }

  if (compact) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900 mb-2">Service Fee: 20%</h4>
            <p className="text-sm text-blue-800">
              TutorMe charges a <strong>20% service fee</strong> on all bookings. This fee covers platform maintenance, 
              payment processing, customer support, and marketing.
            </p>
            <a
              href="/tutor/service-fees"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium mt-2 inline-block"
            >
              View detailed breakdown →
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-pink-100 rounded-lg">
            <DollarSign className="h-6 w-6 text-pink-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Service Fees & Payouts</h2>
            <p className="text-gray-600 mt-1">Understand how our service fees work</p>
          </div>
        </div>
      </div>

      {/* Fee Overview */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Percent className="h-5 w-5 text-pink-600" />
          Service Fee Structure
        </h3>
        <div className="bg-gradient-to-r from-pink-50 to-blue-50 rounded-lg p-6 mb-4">
          <div className="text-center">
            <div className="text-4xl font-bold text-pink-600 mb-2">20%</div>
            <p className="text-gray-700 font-medium">Service Fee on All Bookings</p>
            <p className="text-sm text-gray-600 mt-2">You receive 80% of the booking amount</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Service Fee</div>
            <div className="text-2xl font-bold text-gray-800">20%</div>
            <div className="text-xs text-gray-500 mt-1">Deducted from booking price</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Your Payout</div>
            <div className="text-2xl font-bold text-green-600">80%</div>
            <div className="text-xs text-gray-500 mt-1">What you receive</div>
          </div>
        </div>
      </div>

      {/* What the Fee Covers */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-600" />
          What the Service Fee Covers
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-800">Platform Maintenance</h4>
                <p className="text-sm text-gray-600">Keeping the platform running smoothly and securely</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Receipt className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-800">Payment Processing</h4>
                <p className="text-sm text-gray-600">Secure payment handling and transaction management</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Info className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-800">Customer Support</h4>
                <p className="text-sm text-gray-600">24/7 support for students and tutors</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-800">Marketing & Growth</h4>
                <p className="text-sm text-gray-600">Promoting the platform and bringing in new students</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calculation Examples */}
      {showExamples && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Calculator className="h-5 w-5 text-pink-600" />
            Payout Calculation Examples
          </h3>
          <div className="space-y-4">
            {examples.map((example, index) => {
              const { fee, payout } = calculateFee(example.bookingPrice)
              return (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-800">{example.description}</h4>
                      <p className="text-sm text-gray-600">Booking Price: {formatCurrency(example.bookingPrice)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-200">
                    <div>
                      <div className="text-xs text-gray-600 mb-1">Booking Price</div>
                      <div className="text-lg font-semibold text-gray-800">
                        {formatCurrency(example.bookingPrice)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 mb-1">Service Fee (20%)</div>
                      <div className="text-lg font-semibold text-red-600">
                        -{formatCurrency(fee)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 mb-1">Your Payout</div>
                      <div className="text-lg font-semibold text-green-600">
                        {formatCurrency(payout)}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Payout Schedule */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Payout Schedule</h3>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            <strong>When you get paid:</strong> Payouts are processed automatically after a student completes payment. 
            The amount shown in your dashboard reflects your payout (after the 20% service fee has been deducted).
          </p>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Frequently Asked Questions</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-800 mb-1">Why is there a service fee?</h4>
            <p className="text-sm text-gray-600">
              The service fee allows us to maintain and improve the platform, provide secure payment processing, 
              offer customer support, and market the platform to bring in more students for you.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-1">Is the fee the same for all bookings?</h4>
            <p className="text-sm text-gray-600">
              Yes, the 20% service fee applies consistently to all bookings, regardless of the lesson type, 
              duration, or subject.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-1">When do I receive my payout?</h4>
            <p className="text-sm text-gray-600">
              Payouts are processed automatically once a student completes payment. The amount you see in your 
              dashboard is your net payout (after the service fee).
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-1">Can I see the fee breakdown for each booking?</h4>
            <p className="text-sm text-gray-600">
              Yes, you can see the booking price, service fee, and your payout amount in your dashboard and 
              booking details.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

