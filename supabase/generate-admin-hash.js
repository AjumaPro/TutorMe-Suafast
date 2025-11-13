#!/usr/bin/env node

/**
 * Generate bcrypt hash for admin password
 * Run: node supabase/generate-admin-hash.js
 */

const bcrypt = require('bcryptjs')

async function generateHash() {
  const password = 'test1234'
  const hash = await bcrypt.hash(password, 10)
  
  console.log('\n🔐 Admin Password Hash\n')
  console.log('=' .repeat(60))
  console.log(`Password: ${password}`)
  console.log(`Hash: ${hash}\n`)
  console.log('📝 Use this hash in supabase/create-admin.sql\n')
  console.log('SQL INSERT statement:')
  console.log('-' .repeat(60))
  console.log(`INSERT INTO "User" (`)
  console.log(`    "id",`)
  console.log(`    "email",`)
  console.log(`    "password",`)
  console.log(`    "name",`)
  console.log(`    "role",`)
  console.log(`    "phone",`)
  console.log(`    "emailVerified",`)
  console.log(`    "failedLoginAttempts",`)
  console.log(`    "accountLockedUntil",`)
  console.log(`    "createdAt",`)
  console.log(`    "updatedAt"`)
  console.log(`) VALUES (`)
  console.log(`    'admin_' || gen_random_uuid()::text,`)
  console.log(`    'infoajumapro@gmail.com',`)
  console.log(`    '${hash}',`)
  console.log(`    'Admin',`)
  console.log(`    'ADMIN',`)
  console.log(`    '123-456-7899',`)
  console.log(`    CURRENT_TIMESTAMP,`)
  console.log(`    0,`)
  console.log(`    NULL,`)
  console.log(`    CURRENT_TIMESTAMP,`)
  console.log(`    CURRENT_TIMESTAMP`)
  console.log(`) ON CONFLICT ("email") DO UPDATE SET`)
  console.log(`    "role" = 'ADMIN',`)
  console.log(`    "password" = '${hash}',`)
  console.log(`    "updatedAt" = CURRENT_TIMESTAMP;`)
  console.log('-' .repeat(60))
  console.log('')
}

generateHash().catch(console.error)

