import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Admin routes - only accessible by admins
    if (path.startsWith('/admin')) {
      if (token?.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    // Tutor routes - only accessible by tutors
    if (path.startsWith('/tutor/profile')) {
      if (token?.role !== 'TUTOR') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    // Parent/Student routes - only accessible by parents
    if (path.startsWith('/search') || (path.startsWith('/tutor/') && path.includes('/book'))) {
      if (token?.role !== 'PARENT') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname
        
        // Allow access to public routes
        const publicRoutes = [
          '/',
          '/auth/signin',
          '/auth/signup',
          '/auth/forgot-password',
          '/auth/verify-email',
          '/api/auth',
        ]
        const isPublicRoute = publicRoutes.some(route => 
          path === route || path.startsWith(route)
        )

        if (isPublicRoute) {
          return true
        }

        // Require authentication for all other routes (including dashboard)
        // NextAuth will automatically redirect to signin if false
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

