#!/usr/bin/env node

/**
 * Test Supabase Connection with Direct Queries
 * Verifies that environment variables are set and connection works
 * 
 * Note: Environment variables should be loaded from .env or .env.local
 * Next.js automatically loads these, but for standalone scripts, you may need:
 * - Install dotenv: npm install dotenv
 * - Or set env vars manually before running
 */

// Try to load dotenv if available (optional)
try {
  require('dotenv').config({ path: '.env.local' })
  require('dotenv').config()
} catch (e) {
  // dotenv not installed - environment variables should be set manually
  console.log('⚠️  dotenv not found - make sure env vars are set in .env or .env.local')
}

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('\n🔍 Testing Supabase Connection\n')
console.log('=' .repeat(60))

// Check environment variables
console.log('\n📋 Environment Variables:')
console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`)
console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅ Set (length: ' + supabaseServiceKey.length + ')' : '❌ Missing'}`)
console.log(`   NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ Set (length: ' + supabaseAnonKey.length + ')' : '❌ Missing'}`)

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('\n❌ Missing required environment variables!')
  console.error('\nRequired:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url')
  console.error('   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key')
  console.error('\nOptional:')
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key')
  process.exit(1)
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testConnection() {
  try {
    console.log('\n🔌 Testing Connection...')
    
    // Test 1: Simple query to users table
    console.log('\n1️⃣ Testing users table query...')
    const { data: users, error: usersError, count } = await supabase
      .from('users')
      .select('*', { count: 'exact' })
      .limit(1)
    
    if (usersError) {
      if (usersError.code === 'PGRST116') {
        console.log('   ⚠️  Users table is empty (this is OK)')
      } else if (usersError.message.includes('relation') || usersError.message.includes('does not exist')) {
        console.error('   ❌ Users table does not exist!')
        console.error('   💡 Run the SQL schema in Supabase SQL Editor:')
        console.error('      File: supabase/schema.sql')
        return false
      } else {
        throw usersError
      }
    } else {
      console.log(`   ✅ Users table accessible (${count || 0} records)`)
    }
    
    // Test 2: Check tutor_profiles table
    console.log('\n2️⃣ Testing tutor_profiles table...')
    const { data: tutors, error: tutorsError } = await supabase
      .from('tutor_profiles')
      .select('*')
      .limit(1)
    
    if (tutorsError) {
      if (tutorsError.code === 'PGRST116') {
        console.log('   ⚠️  Tutor profiles table is empty (this is OK)')
      } else if (tutorsError.message.includes('relation') || tutorsError.message.includes('does not exist')) {
        console.error('   ❌ Tutor profiles table does not exist!')
        console.error('   💡 Run the SQL schema in Supabase SQL Editor')
        return false
      } else {
        throw tutorsError
      }
    } else {
      console.log('   ✅ Tutor profiles table accessible')
    }
    
    // Test 3: Check bookings table
    console.log('\n3️⃣ Testing bookings table...')
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .limit(1)
    
    if (bookingsError) {
      if (bookingsError.code === 'PGRST116') {
        console.log('   ⚠️  Bookings table is empty (this is OK)')
      } else if (bookingsError.message.includes('relation') || bookingsError.message.includes('does not exist')) {
        console.error('   ❌ Bookings table does not exist!')
        console.error('   💡 Run the SQL schema in Supabase SQL Editor')
        return false
      } else {
        throw bookingsError
      }
    } else {
      console.log('   ✅ Bookings table accessible')
    }
    
    // Test 4: Try to find admin user
    console.log('\n4️⃣ Checking for admin user...')
    const { data: admin, error: adminError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'infoajumapro@gmail.com')
      .single()
    
    if (adminError && adminError.code !== 'PGRST116') {
      console.log('   ⚠️  Could not check for admin user')
    } else if (admin) {
      console.log('   ✅ Admin user found!')
      console.log(`      Email: ${admin.email}`)
      console.log(`      Role: ${admin.role}`)
    } else {
      console.log('   ⚠️  Admin user not found')
      console.log('   💡 Run supabase/create-admin.sql to create admin account')
    }
    
    console.log('\n' + '=' .repeat(60))
    console.log('\n✅ Supabase connection successful!')
    console.log('\n📝 Next steps:')
    console.log('   1. If tables are missing, run supabase/schema.sql in Supabase SQL Editor')
    console.log('   2. If admin user is missing, run supabase/create-admin.sql')
    console.log('   3. Test the application: npm run dev')
    console.log('   4. Try logging in with admin account\n')
    
    return true
    
  } catch (error) {
    console.error('\n❌ Connection test failed!')
    console.error('\nError details:')
    console.error(`   Message: ${error.message}`)
    console.error(`   Code: ${error.code || 'N/A'}`)
    
    if (error.message.includes('Invalid API key')) {
      console.error('\n💡 Your SUPABASE_SERVICE_ROLE_KEY might be incorrect')
      console.error('   Get it from: Supabase Dashboard > Settings > API')
    } else if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
      console.error('\n💡 Network error - check your internet connection')
      console.error('   Or verify NEXT_PUBLIC_SUPABASE_URL is correct')
    } else if (error.message.includes('Tenant') || error.message.includes('not found')) {
      console.error('\n💡 Your Supabase project might not exist or be paused')
      console.error('   Check: Supabase Dashboard > Project Settings')
    }
    
    console.log('')
    return false
  }
}

// Run test
testConnection()
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('\n❌ Unexpected error:', error)
    process.exit(1)
  })

