'use client'

import { TrendingUp, Target, Award, Zap } from 'lucide-react'

interface Metric {
  label: string
  value: string | number
  change?: number
  icon: React.ReactNode
  color: string
}

interface PerformanceMetricsProps {
  metrics: Metric[]
}

export default function PerformanceMetrics({ metrics }: PerformanceMetricsProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Target className="h-5 w-5 text-purple-600" />
          Performance Metrics
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200"
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`${metric.color} p-2 rounded-lg`}>{metric.icon}</div>
              {metric.change !== undefined && (
                <div
                  className={`flex items-center gap-1 text-xs ${
                    metric.change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  <TrendingUp
                    className={`h-3 w-3 ${metric.change < 0 ? 'rotate-180' : ''}`}
                  />
                  {Math.abs(metric.change)}%
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mb-1">{metric.label}</p>
            <p className="text-xl font-bold text-gray-900">{metric.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

