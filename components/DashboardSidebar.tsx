'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  Home,
  BarChart3,
  Calendar,
  MessageSquare,
  Settings,
  BookOpen,
  Search,
  User,
  LogOut,
  BookMarked,
  Video,
  Menu,
  X,
  Shield,
  CheckCircle,
  Users,
  UserCheck,
  TrendingUp,
  Bell,
} from 'lucide-react'

export default function DashboardSidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/tutors', label: 'Tutors', icon: Users },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/schedule', label: 'Schedule', icon: Calendar },
    { href: '/messages', label: 'Messages', icon: MessageSquare },
    { href: '/assignments', label: 'Assignments', icon: BookOpen, show: true },
    { href: '/progress', label: 'Progress', icon: TrendingUp, show: true },
    { href: '/notifications', label: 'Notifications', icon: Bell, show: true },
    { href: '/settings', label: 'Settings', icon: Settings },
  ]

  const quickActions = [
    { href: '/search', label: 'Find Tutor', icon: Search, show: session?.user.role === 'PARENT' },
    {
      href: '/tutor/profile',
      label: 'My Profile',
      icon: User,
      show: session?.user.role === 'TUTOR',
    },
    { href: '/bookings', label: 'My Bookings', icon: BookMarked, show: true },
    { href: '/lessons', label: 'Lessons', icon: Video, show: true },
  ]

  const adminItems = [
    { href: '/admin?tab=overview', label: 'Admin Overview', icon: Shield },
    { href: '/admin?tab=tutors', label: 'Tutor Approval', icon: CheckCircle },
    { href: '/admin?tab=students', label: 'Student Management', icon: Users },
    { href: '/admin?tab=assignments', label: 'Class Assignments', icon: BookOpen },
  ]

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md hover:bg-gray-100 transition-colors"
      >
        {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`w-64 bg-white border-r border-gray-200 h-screen fixed lg:sticky top-0 flex flex-col z-40 transform transition-transform duration-300 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <Link href="/" className="flex items-center gap-2" onClick={() => setIsMobileOpen(false)}>
            <img 
              src="/logo.png" 
              alt="Suafast" 
              className="h-8 w-auto"
            />
            <h1 className="text-xl font-bold text-gray-800">Suafast</h1>
          </Link>
        </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
            Main Menu
          </h3>
          <div className="space-y-1">
            {navItems
              .filter((item) => item.show !== false)
              .map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                )
              })}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
            Quick Actions
          </h3>
          <div className="space-y-1">
            {quickActions
              .filter((action) => action.show)
              .map((action) => {
                const Icon = action.icon
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    onClick={() => setIsMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{action.label}</span>
                  </Link>
                )
              })}
          </div>
        </div>

        {/* Administration Section - Only for Admins */}
        {session?.user.role === 'ADMIN' && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
              Administration
            </h3>
            <div className="space-y-1">
              {adminItems.map((item) => {
                const Icon = item.icon
                const tabId = item.href.split('tab=')[1]
                const currentTab = searchParams.get('tab') || 'overview'
                const isActive = pathname === '/admin' && currentTab === tabId
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-gradient-to-r from-red-500 to-orange-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </nav>

      {/* User Section */}
      {session && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
              {session.user.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 text-sm truncate">
                {session.user.name}
              </p>
              <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      )}
      </aside>
    </>
  )
}

