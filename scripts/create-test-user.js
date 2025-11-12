const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createTestUser() {
  try {
    // Hash password
    const password = 'test1234'
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create test parent account
    const parent = await prisma.user.create({
      data: {
        email: 'parent@test.com',
        password: hashedPassword,
        name: 'Test Parent',
        role: 'PARENT',
        phone: '123-456-7890',
      }
    })
    console.log('✅ Created parent account:')
    console.log('   Email: parent@test.com')
    console.log('   Password: test1234')
    console.log('   ID:', parent.id)

    // Create test tutor account
    const tutor = await prisma.user.create({
      data: {
        email: 'tutor@test.com',
        password: hashedPassword,
        name: 'Test Tutor',
        role: 'TUTOR',
        phone: '123-456-7891',
      }
    })

    // Create tutor profile
    await prisma.tutorProfile.create({
      data: {
        userId: tutor.id,
        bio: 'Experienced tutor with 5+ years teaching Math and Science',
        subjects: JSON.stringify(['Math', 'Science', 'English']),
        grades: JSON.stringify(['6-8', '9-12']),
        experience: 5,
        hourlyRate: 50.00,
        isApproved: true, // Auto-approve for testing
      }
    })
    console.log('\n✅ Created tutor account:')
    console.log('   Email: tutor@test.com')
    console.log('   Password: test1234')
    console.log('   ID:', tutor.id)
    console.log('   Profile: Approved and ready to use')

    // Create test admin account
    const admin = await prisma.user.create({
      data: {
        email: 'infoajumapro@gmail.com',
        password: hashedPassword,
        name: 'Admin',
        role: 'ADMIN',
        phone: '123-456-7892',
      }
    })
    console.log('\n✅ Created admin account:')
    console.log('   Email: infoajumapro@gmail.com')
    console.log('   Password: test1234')
    console.log('   ID:', admin.id)

    console.log('\n🎉 All test accounts created successfully!')
    console.log('\nYou can now sign in with any of these accounts at: http://localhost:3000/auth/signin')

  } catch (error) {
    if (error.code === 'P2002') {
      console.log('⚠️  One or more test accounts already exist. Skipping...')
    } else {
      console.error('❌ Error creating test accounts:', error)
    }
  } finally {
    await prisma.$disconnect()
  }
}

createTestUser()

