const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addTutorAvailability() {
  try {
    // Find test tutor by email
    const tutor = await prisma.user.findUnique({
      where: { email: 'tutor@test.com' },
      include: {
        tutorProfile: true,
      },
    })

    if (!tutor || !tutor.tutorProfile) {
      console.log('❌ Test tutor not found. Please run create-test-user.js first.')
      console.log('   Or provide a tutor email as argument: node add-tutor-availability.js tutor@example.com')
      process.exit(1)
    }

    const tutorProfile = tutor.tutorProfile
    console.log(`✅ Found tutor: ${tutor.name} (${tutor.email})`)
    console.log(`   Tutor Profile ID: ${tutorProfile.id}`)

    // Delete existing availability slots
    await prisma.availabilitySlot.deleteMany({
      where: { tutorId: tutorProfile.id },
    })
    console.log('   Cleared existing availability slots')

    // Create availability slots for weekdays (Monday to Friday, 9 AM - 5 PM)
    const weekdaySlots = [1, 2, 3, 4, 5].map((dayOfWeek) => ({
      tutorId: tutorProfile.id,
      dayOfWeek,
      startTime: '09:00',
      endTime: '17:00',
      isAvailable: true,
    }))

    // Create availability slots for weekends (Saturday and Sunday, 10 AM - 4 PM)
    const weekendSlots = [0, 6].map((dayOfWeek) => ({
      tutorId: tutorProfile.id,
      dayOfWeek,
      startTime: '10:00',
      endTime: '16:00',
      isAvailable: true,
    }))

    const allSlots = [...weekdaySlots, ...weekendSlots]

    const result = await prisma.availabilitySlot.createMany({
      data: allSlots,
    })

    console.log(`\n✅ Successfully added ${result.count} availability slots:`)
    console.log('   Weekdays (Mon-Fri): 9:00 AM - 5:00 PM')
    console.log('   Weekends (Sat-Sun): 10:00 AM - 4:00 PM')
    console.log('\n   The tutor is now available for bookings!')
  } catch (error) {
    console.error('❌ Error adding availability:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Allow passing tutor email as argument
const tutorEmail = process.argv[2]

if (tutorEmail) {
  // If email provided, use it instead
  async function addAvailabilityForEmail() {
    try {
      const tutor = await prisma.user.findUnique({
        where: { email: tutorEmail },
        include: {
          tutorProfile: true,
        },
      })

      if (!tutor || !tutor.tutorProfile) {
        console.log(`❌ Tutor with email ${tutorEmail} not found or has no profile.`)
        process.exit(1)
      }

      const tutorProfile = tutor.tutorProfile
      console.log(`✅ Found tutor: ${tutor.name} (${tutor.email})`)

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

      const weekendSlots = [0, 6].map((dayOfWeek) => ({
        tutorId: tutorProfile.id,
        dayOfWeek,
        startTime: '10:00',
        endTime: '16:00',
        isAvailable: true,
      }))

      const result = await prisma.availabilitySlot.createMany({
        data: [...weekdaySlots, ...weekendSlots],
      })

      console.log(`\n✅ Successfully added ${result.count} availability slots`)
    } catch (error) {
      console.error('❌ Error:', error)
      process.exit(1)
    } finally {
      await prisma.$disconnect()
    }
  }
  addAvailabilityForEmail()
} else {
  addTutorAvailability()
}

