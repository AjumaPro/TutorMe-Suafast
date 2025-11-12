'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { User, Bell, Lock, CreditCard, Shield, Moon, Globe, Key, Download, Activity, Smartphone, Mail } from 'lucide-react'
import SettingsForm from '@/components/SettingsForm'
import NotificationPreferences from '@/components/NotificationPreferences'
import PrivacySettings from '@/components/PrivacySettings'
import AccountActions from '@/components/AccountActions'
import SecuritySettings from '@/components/SecuritySettings'
import PaymentMethods from '@/components/PaymentMethods'
import PreferencesSettings from '@/components/PreferencesSettings'
import SessionManagement from '@/components/SessionManagement'
import DataExport from '@/components/DataExport'
import ActivityLog from '@/components/ActivityLog'
import Navbar from '@/components/Navbar'

export default function SettingsPage() {
  const { data: session } = useSession()
  const [activeSection, setActiveSection] = useState('profile')

  const settingsSections = [
    {
      id: 'profile',
      title: 'Profile Settings',
      icon: User,
      description: 'Manage your personal information',
    },
    {
      id: 'security',
      title: 'Security',
      icon: Lock,
      description: 'Password and security settings',
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: Bell,
      description: 'Configure your notification preferences',
    },
    {
      id: 'payment',
      title: 'Payment Methods',
      icon: CreditCard,
      description: 'Manage your payment information',
    },
    {
      id: 'privacy',
      title: 'Privacy',
      icon: Shield,
      description: 'Control your privacy settings',
    },
    {
      id: 'preferences',
      title: 'Preferences',
      icon: Moon,
      description: 'Appearance and language settings',
    },
    {
      id: 'sessions',
      title: 'Active Sessions',
      icon: Smartphone,
      description: 'Manage your active sessions',
    },
    {
      id: 'data',
      title: 'Data & Export',
      icon: Download,
      description: 'Export your data',
    },
    {
      id: 'activity',
      title: 'Activity Log',
      icon: Activity,
      description: 'View your account activity',
    },
  ]

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Profile Settings</h2>
              <p className="text-gray-600 text-sm">Update your personal information</p>
            </div>
            <SettingsForm />
            <div className="pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-4">Account Actions</h3>
              <div className="space-y-3">
                <AccountActions />
              </div>
            </div>
          </div>
        )
      case 'security':
        return <SecuritySettings />
      case 'notifications':
        return <NotificationPreferences />
      case 'payment':
        return <PaymentMethods />
      case 'privacy':
        return <PrivacySettings />
      case 'preferences':
        return <PreferencesSettings />
      case 'sessions':
        return <SessionManagement />
      case 'data':
        return <DataExport />
      case 'activity':
        return <ActivityLog />
      default:
        return <SettingsForm />
    }
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Settings Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-4 sticky top-4">
              <nav className="space-y-1">
                {settingsSections.map((section) => {
                  const Icon = section.icon
                  const isActive = activeSection === section.id
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                        isActive
                          ? 'bg-pink-50 text-pink-600 border-l-4 border-pink-600'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${isActive ? 'text-pink-600' : 'text-gray-600'}`} />
                      <div>
                        <p className={`font-medium text-sm ${isActive ? 'text-pink-600' : 'text-gray-800'}`}>
                          {section.title}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-md p-6">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
