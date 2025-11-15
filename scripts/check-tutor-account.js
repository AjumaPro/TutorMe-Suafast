/**
 * Check if a tutor account exists
 * Usage: node scripts/check-tutor-account.js <email>
 */

// Try .env.local first, then .env
require('dotenv').config({ path: '.env.local' })
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  require('dotenv').config({ path: '.env' })
}
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const email = process.argv[2] || 'sarah.johnson@tutorme.com'

async function checkTutor() {
  console.log(`🔍 Checking for tutor account: ${email}\n`)

  try {
    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (userError && userError.code !== 'PGRST116') {
      console.error('❌ Error:', userError.message)
      return
    }

    if (!user) {
      console.log('❌ User not found!')
      console.log('\n💡 To create sample tutor accounts, run:')
      console.log('   npm run seed:tutors')
      return
    }

    console.log('✅ User found!')
    console.log(`   ID: ${user.id}`)
    console.log(`   Name: ${user.name}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   Password hash exists: ${user.password ? 'Yes' : 'No'}`)
    console.log(`   Email verified: ${user.emailVerified ? 'Yes' : 'No'}`)

    // Check tutor profile
    const { data: tutorProfile, error: profileError } = await supabase
      .from('tutor_profiles')
      .select('*')
      .eq('userId', user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('❌ Error checking tutor profile:', profileError.message)
      return
    }

    if (!tutorProfile) {
      console.log('\n⚠️  Tutor profile not found!')
      console.log('   User exists but has no tutor profile.')
    } else {
      console.log('\n✅ Tutor profile found!')
      console.log(`   Profile ID: ${tutorProfile.id}`)
      console.log(`   Is Approved: ${tutorProfile.isApproved ? 'Yes' : 'No'}`)
      console.log(`   Is Verified: ${tutorProfile.isVerified ? 'Yes' : 'No'}`)
      console.log(`   Hourly Rate: ${tutorProfile.hourlyRate} ${tutorProfile.currency || 'GHS'}`)
    }

    console.log('\n📝 Login credentials:')
    console.log(`   Email: ${user.email}`)
    console.log(`   Password: (check if password hash exists above)`)
    
    if (!user.password) {
      console.log('\n⚠️  WARNING: User has no password hash!')
      console.log('   This account cannot be used for login.')
      console.log('   You need to create the account using the seed script.')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkTutor()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })

