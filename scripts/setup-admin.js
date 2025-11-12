const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

const ADMIN_EMAIL = 'infoajumapro@gmail.com'
const DEFAULT_PASSWORD = 'test1234'

async function setupAdmin() {
  try {
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10)

    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL },
    })

    if (existingAdmin) {
      // Update existing user to admin role
      const updatedAdmin = await prisma.user.update({
        where: { email: ADMIN_EMAIL },
        data: {
          role: 'ADMIN',
          password: hashedPassword, // Update password in case it changed
        },
      })
      console.log('✅ Updated existing user to admin:')
      console.log(`   Email: ${ADMIN_EMAIL}`)
      console.log(`   Password: ${DEFAULT_PASSWORD}`)
      console.log(`   Role: ${updatedAdmin.role}`)
      console.log(`   ID: ${updatedAdmin.id}`)
    } else {
      // Create new admin user
      const admin = await prisma.user.create({
        data: {
          email: ADMIN_EMAIL,
          password: hashedPassword,
          name: 'Admin',
          role: 'ADMIN',
          phone: null,
        },
      })
      console.log('✅ Created admin account:')
      console.log(`   Email: ${ADMIN_EMAIL}`)
      console.log(`   Password: ${DEFAULT_PASSWORD}`)
      console.log(`   Role: ${admin.role}`)
      console.log(`   ID: ${admin.id}`)
    }

    console.log('\n🎉 Admin account is ready!')
    console.log(`\nYou can now sign in at: http://localhost:3000/auth/signin`)
    console.log(`   Email: ${ADMIN_EMAIL}`)
    console.log(`   Password: ${DEFAULT_PASSWORD}`)

  } catch (error) {
    console.error('❌ Error setting up admin account:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

setupAdmin()

