// Quick test script to check login functionality
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testLogin() {
  try {
    console.log('🔍 Testing login functionality...\n');
    
    // Check if test users exist
    const testUsers = await prisma.user.findMany({
      where: {
        email: {
          in: ['parent@test.com', 'tutor@test.com', 'infoajumapro@gmail.com']
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true,
        accountLockedUntil: true,
        failedLoginAttempts: true,
        lastLoginAt: true,
      }
    });

    console.log(`Found ${testUsers.length} test users:\n`);
    
    for (const user of testUsers) {
      console.log(`User: ${user.email}`);
      console.log(`  - Name: ${user.name}`);
      console.log(`  - Role: ${user.role}`);
      console.log(`  - Has Password: ${!!user.password}`);
      console.log(`  - Account Locked: ${user.accountLockedUntil ? 'Yes (until ' + user.accountLockedUntil + ')' : 'No'}`);
      console.log(`  - Failed Attempts: ${user.failedLoginAttempts || 0}`);
      console.log(`  - Last Login: ${user.lastLoginAt || 'Never'}`);
      
      // Test password
      if (user.password) {
        const testPassword = 'test1234';
        const isValid = await bcrypt.compare(testPassword, user.password);
        console.log(`  - Password Test (test1234): ${isValid ? '✅ Valid' : '❌ Invalid'}`);
      }
      console.log('');
    }

    // Check for locked accounts
    const lockedAccounts = await prisma.user.findMany({
      where: {
        accountLockedUntil: {
          gt: new Date()
        }
      },
      select: {
        email: true,
        accountLockedUntil: true,
        failedLoginAttempts: true,
      }
    });

    if (lockedAccounts.length > 0) {
      console.log(`⚠️  Found ${lockedAccounts.length} locked account(s):`);
      lockedAccounts.forEach(acc => {
        const minutesLeft = Math.ceil((new Date(acc.accountLockedUntil).getTime() - new Date().getTime()) / 60000);
        console.log(`  - ${acc.email}: Locked for ${minutesLeft} more minutes (${acc.failedLoginAttempts} failed attempts)`);
      });
      console.log('');
    }

    // Unlock expired lockouts
    const expiredLockouts = await prisma.user.findMany({
      where: {
        accountLockedUntil: {
          lte: new Date(),
          not: null,
        }
      }
    });

    if (expiredLockouts.length > 0) {
      console.log(`🔓 Unlocking ${expiredLockouts.length} expired lockout(s)...`);
      await prisma.user.updateMany({
        where: {
          accountLockedUntil: {
            lte: new Date(),
            not: null,
          }
        },
        data: {
          accountLockedUntil: null,
          failedLoginAttempts: 0,
        }
      });
      console.log('✅ Expired lockouts cleared\n');
    }

    console.log('✅ Test complete!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();

