/**
 * Supabase Database Client
 * Direct Supabase PostgreSQL client - no compatibility layer
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseClient: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient {
  // Return existing client if already initialized
  if (supabaseClient) {
    return supabaseClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // During build time, environment variables may not be available
  // Only throw error at runtime when actually trying to use Supabase
  if (!supabaseUrl || !supabaseServiceKey) {
    // Check if we're in a build context (Next.js sets this)
    const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                       process.env.NEXT_PHASE === 'phase-development-build' ||
                       process.env.NODE_ENV === 'production' && !process.env.VERCEL
    
    if (isBuildTime) {
      // During build, return a mock client that will fail gracefully
      // This allows the build to complete, but API routes will fail at runtime if env vars are missing
      console.warn('⚠️  Supabase env vars not available during build. API routes will require them at runtime.')
      // Create a client with placeholder values - it will fail at runtime if actually used
      supabaseClient = createClient(
        supabaseUrl || 'https://placeholder.supabase.co',
        supabaseServiceKey || 'placeholder-key',
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )
      return supabaseClient
    }
    
    // At runtime, log warning but don't throw - let queries fail gracefully
    console.error('❌ Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    // Create a client with placeholder values that will fail queries gracefully
    supabaseClient = createClient(
      'https://placeholder.supabase.co',
      'placeholder-key',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    return supabaseClient
  }

  // Create Supabase client with service role key for server-side operations
  // Service role key bypasses Row Level Security (RLS)
  supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  return supabaseClient
}

// Export supabase client (lazy initialization)
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return getSupabaseClient()[prop as keyof SupabaseClient]
  }
})

// Export supabase as default for convenience
export default supabase
