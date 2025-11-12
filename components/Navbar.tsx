'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Home, BarChart3, Calendar, MessageSquare, Settings, Search, Bell, BookOpen, LogOut, Users } from 'lucide-react'
import NotificationsBell from './NotificationsBell'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()

  const navItems = [
    { href: '/dashboard', label: 'Home', icon: Home },
    { href: '/tutors', label: 'Tutors', icon: Users },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/schedule', label: 'Schedule', icon: Calendar },
    { href: '/messages', label: 'Message', icon: MessageSquare },
    { href: '/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center">
            <img 
              src="/logo.png" 
              alt="Suafast" 
              className="h-8 w-auto"
            />
          </Link>
          
          {session ? (
            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'text-pink-600 bg-pink-50'
                          : 'text-gray-700 hover:text-pink-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <NotificationsBell />
                <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                    {session.user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link
                href="/auth/signin"
                className="text-gray-700 hover:text-pink-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="bg-pink-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-pink-700"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

