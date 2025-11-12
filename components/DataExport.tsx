'use client'

import { useState } from 'react'
import { Download, FileText, Database, Mail, Clock } from 'lucide-react'

export default function DataExport() {
  const [exporting, setExporting] = useState(false)
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json')

  const handleExport = async () => {
    setExporting(true)
    try {
      const response = await fetch(`/api/settings/export?format=${exportFormat}`, {
        method: 'GET',
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `tutorme-data-${new Date().toISOString().split('T')[0]}.${exportFormat}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (err) {
      console.error('Failed to export data:', err)
      alert('Failed to export data. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const handleRequestData = async () => {
    setExporting(true)
    try {
      const response = await fetch('/api/settings/export-request', {
        method: 'POST',
      })

      if (response.ok) {
        alert('Data export request submitted. You will receive an email with your data within 24 hours.')
      }
    } catch (err) {
      console.error('Failed to request data export:', err)
      alert('Failed to submit data export request. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2 flex items-center gap-2">
          <Download className="h-6 w-6 text-pink-600" />
          Data & Export
        </h2>
        <p className="text-gray-600 text-sm">Download or request a copy of your data</p>
      </div>

      {/* Quick Export */}
      <div className="border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold text-gray-800">Quick Export</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Download your account data in the selected format. This includes your profile, bookings, messages, and other account information.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setExportFormat('json')}
                className={`px-4 py-3 border-2 rounded-lg font-medium transition-colors ${
                  exportFormat === 'json'
                    ? 'border-pink-500 bg-pink-50 text-pink-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <FileText className="h-5 w-5 mx-auto mb-2" />
                JSON
              </button>
              <button
                onClick={() => setExportFormat('csv')}
                className={`px-4 py-3 border-2 rounded-lg font-medium transition-colors ${
                  exportFormat === 'csv'
                    ? 'border-pink-500 bg-pink-50 text-pink-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <FileText className="h-5 w-5 mx-auto mb-2" />
                CSV
              </button>
            </div>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
          >
            <Download className="h-5 w-5" />
            {exporting ? 'Exporting...' : 'Download Data'}
          </button>
        </div>
      </div>

      {/* Full Data Request */}
      <div className="border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold text-gray-800">Request Full Data Export</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Request a complete copy of all your data. This includes all your information, activity logs, and files. 
          You&apos;ll receive an email with a download link within 24 hours.
        </p>
        <button
          onClick={handleRequestData}
          disabled={exporting}
          className="px-6 py-3 border-2 border-pink-600 text-pink-600 rounded-lg hover:bg-pink-50 disabled:opacity-50 font-medium flex items-center gap-2"
        >
          <Mail className="h-5 w-5" />
          {exporting ? 'Requesting...' : 'Request Data Export'}
        </button>
      </div>

      {/* Data Included */}
      <div className="border border-blue-200 bg-blue-50 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">What&apos;s Included in Your Export</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>Profile information and account settings</span>
          </li>
          <li className="flex items-start gap-2">
            <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>All bookings and lesson history</span>
          </li>
          <li className="flex items-start gap-2">
            <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>Messages and conversations</span>
          </li>
          <li className="flex items-start gap-2">
            <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>Assignments and progress entries</span>
          </li>
          <li className="flex items-start gap-2">
            <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>Payment history and receipts</span>
          </li>
          <li className="flex items-start gap-2">
            <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>Reviews and ratings</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

