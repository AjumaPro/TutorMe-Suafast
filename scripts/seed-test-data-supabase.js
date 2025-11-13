/**
 * Seed Test Data for Supabase
 * Creates test users (parents and tutors) with related data
 * 
 * Usage: node scripts/seed-test-data-supabase.js
 * 
 * Make sure you have .env file with:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

// Try loading from .env.local first, then .env
require('dotenv').config({ path: '.env.local' })
require('dotenv').config({ path: '.env' })
const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

// Generate UUID v4
function uuidv4() {
  return crypto.randomUUID()
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables!')
  console.error('   Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const DEFAULT_PASSWORD = 'test1234'

// Sample data for students/parents
const students = [
  { name: 'Alice Johnson', email: 'alice@student.com', phone: '024-123-4567' },
  { name: 'Bob Smith', email: 'bob@student.com', phone: '024-234-5678' },
  { name: 'Carol Williams', email: 'carol@student.com', phone: '024-345-6789' },
  { name: 'David Brown', email: 'david@student.com', phone: '024-456-7890' },
  { name: 'Emma Davis', email: 'emma@student.com', phone: '024-567-8901' },
  { name: 'Frank Miller', email: 'frank@student.com', phone: '024-678-9012' },
  { name: 'Grace Wilson', email: 'grace@student.com', phone: '024-789-0123' },
]

// Sample data for tutors
const tutors = [
  {
    name: 'Dr. Sarah Mathis',
    email: 'sarah@tutor.com',
    phone: '020-111-2222',
    bio: 'PhD in Mathematics with 10+ years of teaching experience. Specialized in Algebra, Calculus, and Geometry. Passionate about making math accessible and fun for all students.',
    subjects: ['Math', 'Algebra', 'Calculus', 'Geometry'],
    grades: ['9-12', 'College'],
    experience: 10,
    hourlyRate: 75.00,
    isVerified: true,
  },
  {
    name: 'Prof. James Science',
    email: 'james@tutor.com',
    phone: '020-222-3333',
    bio: 'Experienced science teacher specializing in Physics, Chemistry, and Biology. Former high school teacher with a passion for hands-on learning.',
    subjects: ['Science', 'Physics', 'Chemistry', 'Biology'],
    grades: ['6-8', '9-12'],
    experience: 8,
    hourlyRate: 65.00,
    isVerified: true,
  },
  {
    name: 'Ms. Emily English',
    email: 'emily@tutor.com',
    phone: '020-333-4444',
    bio: 'English Literature graduate with expertise in essay writing, grammar, and literature analysis. Helps students improve their writing skills and critical thinking.',
    subjects: ['English', 'Literature', 'Writing'],
    grades: ['K-5', '6-8', '9-12'],
    experience: 5,
    hourlyRate: 50.00,
    isVerified: false,
  },
  {
    name: 'Mr. Michael Coding',
    email: 'michael@tutor.com',
    phone: '020-444-5555',
    bio: 'Software engineer turned tutor. Teaching programming, web development, and computer science. Real-world experience in tech industry.',
    subjects: ['Computer Science', 'Programming', 'Web Development'],
    grades: ['9-12', 'College'],
    experience: 7,
    hourlyRate: 80.00,
    isVerified: true,
  },
  {
    name: 'Dr. Lisa History',
    email: 'lisa@tutor.com',
    phone: '020-555-6666',
    bio: 'History professor with expertise in World History, US History, and Social Studies. Makes history come alive through engaging stories and discussions.',
    subjects: ['History', 'Social Studies'],
    grades: ['6-8', '9-12'],
    experience: 12,
    hourlyRate: 70.00,
    isVerified: true,
  },
  {
    name: 'Mr. Robert Spanish',
    email: 'robert@tutor.com',
    phone: '020-666-7777',
    bio: 'Native Spanish speaker teaching Spanish language and culture. Bilingual education specialist with experience teaching all levels.',
    subjects: ['Spanish', 'Languages'],
    grades: ['K-5', '6-8', '9-12'],
    experience: 6,
    hourlyRate: 55.00,
    isVerified: false,
  },
  {
    name: 'Ms. Patricia French',
    email: 'patricia@tutor.com',
    phone: '020-777-8888',
    bio: 'French language expert with 8 years of teaching experience. Specializes in conversational French and exam preparation.',
    subjects: ['French', 'Languages'],
    grades: ['6-8', '9-12', 'College'],
    experience: 8,
    hourlyRate: 60.00,
    isVerified: true,
  },
  {
    name: 'Dr. Thomas Chemistry',
    email: 'thomas@tutor.com',
    phone: '020-888-9999',
    bio: 'Chemistry PhD with expertise in organic and inorganic chemistry. Helps students understand complex chemical concepts through clear explanations.',
    subjects: ['Chemistry', 'Science'],
    grades: ['9-12', 'College'],
    experience: 15,
    hourlyRate: 85.00,
    isVerified: true,
  },
]

async function createUsers() {
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10)
  const createdStudents = []
  const createdTutors = []

  console.log('📚 Creating Students/Parents...\n')

  for (const student of students) {
    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', student.email)
        .single()

      if (existingUser) {
        console.log(`⚠️  Student already exists: ${student.email}`)
        createdStudents.push(existingUser)
        continue
      }

      // Create new user
      const userId = uuidv4()
      const now = new Date().toISOString()

      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: student.email,
          password: hashedPassword,
          name: student.name,
          role: 'PARENT',
          phone: student.phone,
          createdAt: now,
          updatedAt: now,
        })
        .select()
        .single()

      if (userError) {
        console.error(`❌ Error creating ${student.name}:`, userError.message)
        continue
      }

      createdStudents.push(newUser)
      console.log(`✅ Created student: ${student.name} (${student.email})`)
    } catch (error) {
      console.error(`❌ Error creating ${student.name}:`, error.message)
    }
  }

  console.log(`\n👨‍🏫 Creating Tutors...\n`)

  for (const tutor of tutors) {
    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', tutor.email)
        .single()

      let userId
      if (existingUser) {
        console.log(`⚠️  Tutor user already exists: ${tutor.email}`)
        userId = existingUser.id
      } else {
        // Create new user
        userId = uuidv4()
        const now = new Date().toISOString()

        const { data: newUser, error: userError } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: tutor.email,
            password: hashedPassword,
            name: tutor.name,
            role: 'TUTOR',
            phone: tutor.phone,
            createdAt: now,
            updatedAt: now,
          })
          .select()
          .single()

        if (userError) {
          console.error(`❌ Error creating user for ${tutor.name}:`, userError.message)
          continue
        }
      }

      // Check if tutor profile exists
      const { data: existingProfile } = await supabase
        .from('tutor_profiles')
        .select('id')
        .eq('userId', userId)
        .single()

      let tutorProfileId
      const now = new Date().toISOString()

      if (existingProfile) {
        tutorProfileId = existingProfile.id
        // Update existing profile
        const { error: updateError } = await supabase
          .from('tutor_profiles')
          .update({
            bio: tutor.bio,
            subjects: JSON.stringify(tutor.subjects),
            grades: JSON.stringify(tutor.grades),
            experience: tutor.experience,
            hourlyRate: tutor.hourlyRate,
            currency: 'GHS', // Default to Ghana Cedis
            isVerified: tutor.isVerified,
            isApproved: true, // Auto-approve for testing
            updatedAt: now,
          })
          .eq('id', tutorProfileId)

        if (updateError) {
          console.error(`❌ Error updating profile for ${tutor.name}:`, updateError.message)
          continue
        }
      } else {
        // Create new tutor profile
        tutorProfileId = uuidv4()
        const { data: newProfile, error: profileError } = await supabase
          .from('tutor_profiles')
          .insert({
            id: tutorProfileId,
            userId: userId,
            bio: tutor.bio,
            subjects: JSON.stringify(tutor.subjects),
            grades: JSON.stringify(tutor.grades),
            experience: tutor.experience,
            hourlyRate: tutor.hourlyRate,
            currency: 'GHS', // Default to Ghana Cedis
            isVerified: tutor.isVerified,
            isApproved: true, // Auto-approve for testing
            rating: 0,
            totalReviews: 0,
            createdAt: now,
            updatedAt: now,
          })
          .select()
          .single()

        if (profileError) {
          console.error(`❌ Error creating profile for ${tutor.name}:`, profileError.message)
          continue
        }
      }

      // Delete existing availability slots
      await supabase
        .from('availability_slots')
        .delete()
        .eq('tutorId', tutorProfileId)

      // Add availability slots (Monday to Friday, 9 AM - 5 PM)
      const weekdaySlots = [1, 2, 3, 4, 5].map((dayOfWeek) => ({
        id: uuidv4(),
        tutorId: tutorProfileId,
        dayOfWeek,
        startTime: '09:00',
        endTime: '17:00',
        isAvailable: true,
        createdAt: now,
        updatedAt: now,
      }))

      const { error: slotsError } = await supabase
        .from('availability_slots')
        .insert(weekdaySlots)

      if (slotsError) {
        console.error(`⚠️  Error creating availability slots for ${tutor.name}:`, slotsError.message)
      }

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      createdTutors.push({ user: userData, tutorProfileId })
      console.log(`✅ Created tutor: ${tutor.name} (${tutor.email})`)
      console.log(`   Subjects: ${tutor.subjects.join(', ')}`)
      console.log(`   Rate: ₵${tutor.hourlyRate}/hr`)
      console.log(`   Approved: Yes`)
    } catch (error) {
      console.error(`❌ Error creating ${tutor.name}:`, error.message)
    }
  }

  return { createdStudents, createdTutors }
}

async function main() {
  try {
    console.log('🌱 Starting database seeding with Supabase...\n')
    console.log('='.repeat(50))

    const { createdStudents, createdTutors } = await createUsers()

    console.log('\n' + '='.repeat(50))
    console.log('\n📊 Summary:')
    console.log(`   Students created: ${createdStudents.length}`)
    console.log(`   Tutors created: ${createdTutors.length}`)
    console.log('\n🔑 Login Credentials:')
    console.log(`   Password for all accounts: ${DEFAULT_PASSWORD}`)
    console.log('\n📧 Student/Parent Accounts:')
    students.forEach((s) => {
      console.log(`   ${s.email} - ${s.name}`)
    })
    console.log('\n👨‍🏫 Tutor Accounts:')
    tutors.forEach((t) => {
      console.log(`   ${t.email} - ${t.name} (₵${t.hourlyRate}/hr)`)
    })

    console.log('\n✅ Seeding completed successfully!')
    console.log('\n💡 Next steps:')
    console.log('   1. Sign in as a student at: http://localhost:3000/auth/signin')
    console.log('   2. Browse tutors and create bookings')
    console.log('   3. Test the payment flow with Paystack test cards')
    console.log('\n')

  } catch (error) {
    console.error('❌ Error during seeding:', error)
    process.exit(1)
  }
}

main()

