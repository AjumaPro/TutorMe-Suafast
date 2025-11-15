/**
 * Create sample tutor accounts for testing
 * Run: node scripts/create-sample-tutors.js
 */

// Try .env.local first, then .env
require('dotenv').config({ path: '.env.local' })
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  require('dotenv').config({ path: '.env' })
}
const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const sampleTutors = [
  {
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@tutorme.com',
    password: 'Tutor123!',
    phone: '+1234567890',
    bio: 'Experienced mathematics tutor with 10+ years of teaching experience. Specialized in algebra, calculus, and geometry. PhD in Mathematics from MIT.',
    subjects: ['Math', 'Science'],
    grades: ['9-12', 'College'],
    hourlyRate: 50,
    currency: 'GHS',
    experience: 10,
    city: 'Accra',
    state: 'Greater Accra',
    zipCode: 'GA-001',
  },
  {
    name: 'Prof. Michael Chen',
    email: 'michael.chen@tutorme.com',
    password: 'Tutor123!',
    phone: '+1234567891',
    bio: 'Computer Science professor with expertise in programming, data structures, and algorithms. Former software engineer at Google.',
    subjects: ['Computer Science', 'Math'],
    grades: ['9-12', 'College', 'Adult'],
    hourlyRate: 60,
    currency: 'GHS',
    experience: 15,
    city: 'Kumasi',
    state: 'Ashanti',
    zipCode: 'AS-001',
  },
  {
    name: 'Ms. Emily Williams',
    email: 'emily.williams@tutorme.com',
    password: 'Tutor123!',
    phone: '+1234567892',
    bio: 'Passionate English teacher specializing in literature, writing, and grammar. Helps students improve their communication skills.',
    subjects: ['English', 'Test Prep'],
    grades: ['6-8', '9-12'],
    hourlyRate: 40,
    currency: 'GHS',
    experience: 8,
    city: 'Tamale',
    state: 'Northern',
    zipCode: 'NR-001',
  },
  {
    name: 'Dr. James Anderson',
    email: 'james.anderson@tutorme.com',
    password: 'Tutor123!',
    phone: '+1234567893',
    bio: 'Chemistry and Physics tutor with a PhD in Physical Chemistry. Makes complex concepts easy to understand.',
    subjects: ['Science'],
    grades: ['9-12', 'College'],
    hourlyRate: 55,
    currency: 'GHS',
    experience: 12,
    city: 'Cape Coast',
    state: 'Central',
    zipCode: 'CC-001',
  },
  {
    name: 'Ms. Lisa Martinez',
    email: 'lisa.martinez@tutorme.com',
    password: 'Tutor123!',
    phone: '+1234567894',
    bio: 'Elementary school teacher with expertise in all subjects for K-5 students. Patient and encouraging teaching style.',
    subjects: ['Math', 'English', 'Science'],
    grades: ['K-5'],
    hourlyRate: 35,
    currency: 'GHS',
    experience: 6,
    city: 'Takoradi',
    state: 'Western',
    zipCode: 'WR-001',
  },
  {
    name: 'Mr. David Brown',
    email: 'david.brown@tutorme.com',
    password: 'Tutor123!',
    phone: '+1234567895',
    bio: 'History and Social Studies tutor. Makes history come alive with engaging stories and interactive lessons.',
    subjects: ['History'],
    grades: ['6-8', '9-12'],
    hourlyRate: 38,
    currency: 'GHS',
    experience: 7,
    city: 'Sunyani',
    state: 'Bono',
    zipCode: 'BN-001',
  },
]

async function createSampleTutors() {
  console.log('🚀 Creating sample tutor accounts...\n')

  const createdTutors = []

  for (const tutorData of sampleTutors) {
    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', tutorData.email)
        .single()

      if (existingUser) {
        console.log(`⚠️  User ${tutorData.email} already exists, skipping...`)
        continue
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(tutorData.password, 10)

      // Create user
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: tutorData.email,
          password: hashedPassword,
          name: tutorData.name,
          role: 'TUTOR',
          phone: tutorData.phone,
          emailVerified: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })

      if (userError) {
        console.error(`❌ Error creating user ${tutorData.email}:`, userError.message)
        continue
      }

      // Create tutor profile
      const tutorProfileId = `tutor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const { error: profileError } = await supabase
        .from('tutor_profiles')
        .insert({
          id: tutorProfileId,
          userId: userId,
          bio: tutorData.bio,
          subjects: JSON.stringify(tutorData.subjects),
          grades: JSON.stringify(tutorData.grades),
          hourlyRate: tutorData.hourlyRate,
          currency: tutorData.currency,
          experience: tutorData.experience,
          city: tutorData.city,
          state: tutorData.state,
          zipCode: tutorData.zipCode,
          isApproved: true, // Auto-approve sample tutors
          isVerified: true,
          rating: 0,
          totalReviews: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })

      if (profileError) {
        console.error(`❌ Error creating tutor profile for ${tutorData.email}:`, profileError.message)
        // Clean up user if profile creation fails
        await supabase.from('users').delete().eq('id', userId)
        continue
      }

      createdTutors.push({
        name: tutorData.name,
        email: tutorData.email,
        password: tutorData.password,
        tutorProfileId,
      })

      console.log(`✅ Created tutor: ${tutorData.name} (${tutorData.email})`)
    } catch (error) {
      console.error(`❌ Error creating tutor ${tutorData.email}:`, error.message)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('📋 Sample Tutor Accounts Created:')
  console.log('='.repeat(60))
  console.log('\nLogin Credentials:\n')

  createdTutors.forEach((tutor, index) => {
    console.log(`${index + 1}. ${tutor.name}`)
    console.log(`   Email: ${tutor.email}`)
    console.log(`   Password: ${tutor.password}`)
    console.log(`   Profile ID: ${tutor.tutorProfileId}`)
    console.log('')
  })

  console.log('='.repeat(60))
  console.log(`✅ Successfully created ${createdTutors.length} tutor account(s)`)
  console.log('='.repeat(60))
  console.log('\n💡 All tutors are auto-approved and ready to use!')
  console.log('💡 You can now log in with any of these accounts at /auth/signin\n')
}

// Run the script
createSampleTutors()
  .then(() => {
    console.log('✨ Script completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })

