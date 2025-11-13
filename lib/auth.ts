import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { supabase } from './supabase-db'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { 
          label: 'Email', 
          type: 'email',
          placeholder: 'your@email.com'
        },
        password: { 
          label: 'Password', 
          type: 'password' 
        }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        try {
          const email = credentials.email.toLowerCase().trim()
          
          // Find user by email
          const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single()
          
          if (userError && userError.code !== 'PGRST116') throw userError

          if (!user) {
            console.log('❌ User not found:', email)
            throw new Error('Invalid email or password')
          }

          // Check if account is locked (handle null/undefined gracefully)
          const lockoutTime = user.accountLockedUntil
          if (lockoutTime && new Date(lockoutTime) > new Date()) {
            const minutesLeft = Math.ceil((new Date(lockoutTime).getTime() - new Date().getTime()) / 60000)
            throw new Error(`Account is locked. Please try again in ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.`)
          }
          
          // Auto-unlock if lockout period has passed
          if (lockoutTime && new Date(lockoutTime) <= new Date()) {
            await supabase
              .from('users')
              .update({
                accountLockedUntil: null,
                failedLoginAttempts: 0,
              })
              .eq('id', user.id)
          }

          // Verify password (handle missing password field)
          if (!user.password) {
            throw new Error('Invalid email or password')
          }
          
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            console.log('❌ Invalid password for:', email)
            
            // Increment failed login attempts
            const failedAttempts = (user.failedLoginAttempts || 0) + 1
            const maxAttempts = 5
            const lockoutDuration = 15 // minutes

            if (failedAttempts >= maxAttempts) {
              // Lock account for 15 minutes
              const lockoutUntil = new Date(Date.now() + lockoutDuration * 60 * 1000)
              await supabase
                .from('users')
                .update({
                  failedLoginAttempts: failedAttempts,
                  accountLockedUntil: lockoutUntil.toISOString(),
                })
                .eq('id', user.id)
              throw new Error(`Too many failed attempts. Account locked for ${lockoutDuration} minutes.`)
            } else {
              // Update failed attempts
              await supabase
                .from('users')
                .update({ failedLoginAttempts: failedAttempts })
                .eq('id', user.id)
              throw new Error('Invalid email or password')
            }
          }

          // Successful login - reset failed attempts and update last login
          await supabase
            .from('users')
            .update({
              failedLoginAttempts: 0,
              accountLockedUntil: null,
              lastLoginAt: new Date().toISOString(),
            })
            .eq('id', user.id)

          console.log('✅ Authentication successful for:', email)
          // Return user object for NextAuth
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image,
          }
        } catch (error) {
          // Log error in development
          if (process.env.NODE_ENV === 'development') {
            console.error('Auth error:', error)
            if (error instanceof Error) {
              console.error('Error message:', error.message)
              console.error('Error stack:', error.stack)
            }
          }
          
          // Re-throw to let NextAuth handle it
          if (error instanceof Error) {
            throw error
          }
          throw new Error('Authentication failed')
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        token.id = user.id
        token.role = user.role
        token.email = user.email
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      // Send properties to the client
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.email = token.email as string
        session.user.name = token.name as string
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin', // Error page also redirects to signin
  },
  events: {
    async signIn({ user, account, profile }) {
      // Log successful sign in
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Sign in successful:', user.email)
      }
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}
