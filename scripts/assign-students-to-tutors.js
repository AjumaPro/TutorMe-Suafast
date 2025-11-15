/**
 * Assign sample students to tutors with bookings
 * Run: node scripts/assign-students-to-tutors.js
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

const sampleStudents = [
  {
    name: 'John Smith',
    email: 'john.smith@student.com',
    password: 'Student123!',
    phone: '+1234567900',
  },
  {
    name: 'Emma Johnson',
    email: 'emma.johnson@student.com',
    password: 'Student123!',
    phone: '+1234567901',
  },
  {
    name: 'Michael Brown',
    email: 'michael.brown@student.com',
    password: 'Student123!',
    phone: '+1234567902',
  },
  {
    name: 'Sophia Davis',
    email: 'sophia.davis@student.com',
    password: 'Student123!',
    phone: '+1234567903',
  },
  {
    name: 'James Wilson',
    email: 'james.wilson@student.com',
    password: 'Student123!',
    phone: '+1234567904',
  },
  {
    name: 'Olivia Martinez',
    email: 'olivia.martinez@student.com',
    password: 'Student123!',
    phone: '+1234567905',
  },
]

// Assignments: [studentEmail, tutorEmail, subject, daysFromNow, hour, duration]
const assignments = [
  ['john.smith@student.com', 'sarah.johnson@tutorme.com', 'Math', 2, 10, 60],
  ['john.smith@student.com', 'sarah.johnson@tutorme.com', 'Math', 5, 14, 60],
  ['emma.johnson@student.com', 'sarah.johnson@tutorme.com', 'Science', 3, 11, 60],
  ['michael.brown@student.com', 'michael.chen@tutorme.com', 'Computer Science', 1, 15, 90],
  ['michael.brown@student.com', 'michael.chen@tutorme.com', 'Computer Science', 4, 15, 90],
  ['sophia.davis@student.com', 'emily.williams@tutorme.com', 'English', 2, 13, 60],
  ['sophia.davis@student.com', 'emily.williams@tutorme.com', 'English', 6, 10, 60],
  ['james.wilson@student.com', 'james.anderson@tutorme.com', 'Science', 3, 16, 60],
  ['olivia.martinez@student.com', 'lisa.martinez@tutorme.com', 'Math', 1, 14, 60],
  ['olivia.martinez@student.com', 'lisa.martinez@tutorme.com', 'English', 4, 10, 60],
  ['john.smith@student.com', 'david.brown@tutorme.com', 'History', 7, 11, 60],
  ['emma.johnson@student.com', 'james.anderson@tutorme.com', 'Science', 5, 15, 90],
]

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

async function createStudents() {
  console.log('🚀 Creating sample students...\n')

  const createdStudents = []

  for (const studentData of sampleStudents) {
    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', studentData.email)
        .single()

      if (existingUser) {
        console.log(`⚠️  Student ${studentData.email} already exists, using existing...`)
        createdStudents.push(existingUser)
        continue
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(studentData.password, 10)

      // Create user
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: studentData.email,
          password: hashedPassword,
          name: studentData.name,
          role: 'PARENT',
          phone: studentData.phone,
          emailVerified: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })

      if (userError) {
        console.error(`❌ Error creating student ${studentData.email}:`, userError.message)
        continue
      }

      createdStudents.push({ id: userId, email: studentData.email, name: studentData.name })
      console.log(`✅ Created student: ${studentData.name} (${studentData.email})`)
    } catch (error) {
      console.error(`❌ Error creating student ${studentData.email}:`, error.message)
    }
  }

  return createdStudents
}

async function getTutors() {
  const { data: tutors } = await supabase
    .from('tutor_profiles')
    .select('id, userId, hourlyRate, currency')
    .eq('isApproved', true)

  if (!tutors || tutors.length === 0) {
    console.error('❌ No approved tutors found. Please create tutors first.')
    return []
  }

  // Get tutor user emails
  const tutorUserIds = tutors.map((t) => t.userId)
  const { data: tutorUsers } = await supabase
    .from('users')
    .select('id, email')
    .in('id', tutorUserIds)

  const tutorMap = new Map()
  tutors.forEach((tutor) => {
    const user = tutorUsers?.find((u) => u.id === tutor.userId)
    if (user) {
      tutorMap.set(user.email, {
        id: tutor.id,
        userId: tutor.userId,
        hourlyRate: tutor.hourlyRate,
        currency: tutor.currency || 'GHS',
      })
    }
  })

  return tutorMap
}

async function createBookings(students, tutors) {
  console.log('\n📚 Creating bookings/assignments...\n')

  const createdBookings = []
  const now = new Date()

  for (const [studentEmail, tutorEmail, subject, daysFromNow, hour, duration] of assignments) {
    try {
      const student = students.find((s) => s.email === studentEmail)
      const tutor = tutors.get(tutorEmail)

      if (!student) {
        console.log(`⚠️  Student ${studentEmail} not found, skipping...`)
        continue
      }

      if (!tutor) {
        console.log(`⚠️  Tutor ${tutorEmail} not found, skipping...`)
        continue
      }

      // Calculate scheduled date and time
      const scheduledDate = new Date(now)
      scheduledDate.setDate(scheduledDate.getDate() + daysFromNow)
      scheduledDate.setHours(hour, 0, 0, 0)

      // Calculate price
      const price = (tutor.hourlyRate * duration) / 60

      // Create booking
      const bookingId = uuidv4()
      const { error: bookingError } = await supabase
        .from('bookings')
        .insert({
          id: bookingId,
          studentId: student.id,
          tutorId: tutor.id,
          subject: subject,
          lessonType: 'ONLINE',
          scheduledAt: scheduledDate.toISOString(),
          duration: duration,
          price: price,
          currency: tutor.currency,
          status: 'CONFIRMED', // Auto-confirm assignments
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })

      if (bookingError) {
        console.error(`❌ Error creating booking:`, bookingError.message)
        continue
      }

      createdBookings.push({
        student: student.name,
        tutor: tutorEmail,
        subject,
        scheduledAt: scheduledDate.toISOString(),
        duration,
      })

      console.log(
        `✅ Assigned ${student.name} to ${tutorEmail} for ${subject} on ${scheduledDate.toLocaleDateString()} at ${scheduledDate.toLocaleTimeString()}`
      )
    } catch (error) {
      console.error(`❌ Error creating assignment:`, error.message)
    }
  }

  return createdBookings
}

async function assignStudentsToTutors() {
  console.log('='.repeat(60))
  console.log('📋 Assigning Students to Tutors')
  console.log('='.repeat(60))
  console.log('')

  // Step 1: Create students
  const students = await createStudents()

  if (students.length === 0) {
    console.error('❌ No students available. Exiting.')
    process.exit(1)
  }

  // Step 2: Get tutors
  const tutors = await getTutors()

  if (tutors.size === 0) {
    console.error('❌ No tutors available. Please create tutors first.')
    console.log('💡 Run: npm run seed:tutors')
    process.exit(1)
  }

  // Step 3: Create bookings
  const bookings = await createBookings(students, tutors)

  console.log('\n' + '='.repeat(60))
  console.log('✅ Assignment Summary')
  console.log('='.repeat(60))
  console.log(`\n📊 Created ${bookings.length} booking(s)`)
  console.log(`👥 ${students.length} student(s)`)
  console.log(`👨‍🏫 ${tutors.size} tutor(s)`)
  console.log('\n📝 Sample Student Login Credentials:\n')

  students.forEach((student, index) => {
    console.log(`${index + 1}. ${student.name}`)
    console.log(`   Email: ${student.email}`)
    console.log(`   Password: Student123!`)
    console.log('')
  })

  console.log('='.repeat(60))
  console.log('✨ Script completed successfully!')
  console.log('='.repeat(60))
  console.log('\n💡 Students can now log in and see their assigned courses')
  console.log('💡 Tutors can see assigned students in their dashboard\n')
}

// Run the script
assignStudentsToTutors()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })

