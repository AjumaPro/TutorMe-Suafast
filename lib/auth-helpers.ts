import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { redirect } from 'next/navigation'

/**
 * Get the current user session on the server
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user || null
}

/**
 * Require authentication - redirects to signin if not authenticated
 */
export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/auth/signin')
  }
  return user
}

/**
 * Require specific role - redirects to dashboard if role doesn't match
 */
export async function requireRole(role: string) {
  const user = await requireAuth()
  if (user.role !== role) {
    redirect('/dashboard')
  }
  return user
}

/**
 * Check if user has a specific role
 */
export async function hasRole(role: string) {
  const user = await getCurrentUser()
  return user?.role === role
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated() {
  const user = await getCurrentUser()
  return !!user
}

