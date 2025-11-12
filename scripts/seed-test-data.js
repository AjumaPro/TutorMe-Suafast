const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

const DEFAULT_PASSWORD = 'test1234'

// Sample data for students/parents
const students = [
  { name: 'Alice Johnson', email: 'alice@student.com', phone: '024-123-4567' },
  { name: 'Bob Smith', email: 'bob@student.com', phone: '024-234-5678' },
  { name: 'Carol Williams', email: 'carol@student.com', phone: '024-345-6789' },
  { name: 'David Brown', email: 'david@student.com', phone: '024-456-7890' },
  { name: 'Emma Davis', email: 'emma@student.com', phone: '024-567-8901' },
]

// Sample data for tutors
const tutors = [
  {
    name: 'Dr. Sarah Mathis',
    email: 'sarah@tutor.com',
    phone: '020-111-2222',
    bio: 'PhD in Mathematics with 10+ years of teaching experience. Specialized in Algebra, Calculus, and Geometry.',
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
    bio: 'Experienced science teacher specializing in Physics, Chemistry, and Biology. Former high school teacher.',
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
    bio: 'English Literature graduate with expertise in essay writing, grammar, and literature analysis.',
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
    bio: 'Software engineer turned tutor. Teaching programming, web development, and computer science.',
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
    bio: 'History professor with expertise in World History, US History, and Social Studies.',
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
    bio: 'Native Spanish speaker teaching Spanish language and culture. Bilingual education specialist.',
    subjects: ['Spanish', 'Languages'],
    grades: ['K-5', '6-8', '9-12'],
    experience: 6,
    hourlyRate: 55.00,
    isVerified: false,
  },
]

async function createUsers() {
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10)

  console.log('📚 Creating Students/Parents...\n')
  const createdStudents = []

  for (const student of students) {
    try {
      const user = await prisma.user.upsert({
        where: { email: student.email },
        update: {},
        create: {
          email: student.email,
          password: hashedPassword,
          name: student.name,
          role: 'PARENT',
          phone: student.phone,
        },
      })
      createdStudents.push(user)
      console.log(`✅ Created student: ${student.name} (${student.email})`)
    } catch (error) {
      if (error.code === 'P2002') {
        console.log(`⚠️  Student already exists: ${student.email}`)
      } else {
        console.error(`❌ Error creating ${student.name}:`, error.message)
      }
    }
  }

  console.log(`\n👨‍🏫 Creating Tutors...\n`)
  const createdTutors = []

  for (const tutor of tutors) {
    try {
      // Create or get user
      const user = await prisma.user.upsert({
        where: { email: tutor.email },
        update: {
          name: tutor.name,
          phone: tutor.phone,
        },
        create: {
          email: tutor.email,
          password: hashedPassword,
          name: tutor.name,
          role: 'TUTOR',
          phone: tutor.phone,
        },
      })

      // Create or update tutor profile
      const tutorProfile = await prisma.tutorProfile.upsert({
        where: { userId: user.id },
        update: {
          bio: tutor.bio,
          subjects: JSON.stringify(tutor.subjects),
          grades: JSON.stringify(tutor.grades),
          experience: tutor.experience,
          hourlyRate: tutor.hourlyRate,
          isVerified: tutor.isVerified,
          isApproved: true, // Auto-approve for testing
        },
        create: {
          userId: user.id,
          bio: tutor.bio,
          subjects: JSON.stringify(tutor.subjects),
          grades: JSON.stringify(tutor.grades),
          experience: tutor.experience,
          hourlyRate: tutor.hourlyRate,
          isVerified: tutor.isVerified,
          isApproved: true, // Auto-approve for testing
        },
      })

      // Add availability slots (Monday to Friday, 9 AM - 5 PM)
      await prisma.availabilitySlot.deleteMany({
        where: { tutorId: tutorProfile.id },
      })

      const weekdaySlots = [1, 2, 3, 4, 5].map((dayOfWeek) => ({
        tutorId: tutorProfile.id,
        dayOfWeek,
        startTime: '09:00',
        endTime: '17:00',
        isAvailable: true,
      }))

      await prisma.availabilitySlot.createMany({
        data: weekdaySlots,
      })

      createdTutors.push({ user, tutorProfile })
      console.log(`✅ Created tutor: ${tutor.name} (${tutor.email})`)
      console.log(`   Subjects: ${tutor.subjects.join(', ')}`)
      console.log(`   Rate: ₵${tutor.hourlyRate}/hr`)
      console.log(`   Approved: Yes`)
    } catch (error) {
      if (error.code === 'P2002') {
        console.log(`⚠️  Tutor already exists: ${tutor.email}`)
      } else {
        console.error(`❌ Error creating ${tutor.name}:`, error.message)
      }
    }
  }

  return { createdStudents, createdTutors }
}

async function main() {
  try {
    console.log('🌱 Starting database seeding...\n')
    console.log('=' .repeat(50))

    const { createdStudents, createdTutors } = await createUsers()

    console.log('\n' + '='.repeat(50))
    console.log('\n📊 Summary:')
    console.log(`   Students created: ${createdStudents.length}`)
    console.log(`   Tutors created: ${createdTutors.length}`)
    console.log('\n🔑 Login Credentials:')
    console.log(`   Password for all accounts: ${DEFAULT_PASSWORD}`)
    console.log('\n📧 Student Accounts:')
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
  } finally {
    await prisma.$disconnect()
  }
}

main()

