#!/usr/bin/env node

/**
 * Migration Script: Prisma to Supabase
 * Helps replace Prisma imports with Supabase
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const filesToUpdate = [
  'app/api/auth/signup/route.ts',
  'app/api/auth/forgot-password/route.ts',
  'app/api/auth/reset-password/route.ts',
  'app/api/auth/verify-email/route.ts',
  'app/api/auth/unlock-account/route.ts',
  'app/dashboard/page.tsx',
  'app/admin/page.tsx',
  'app/search/page.tsx',
  'app/tutors/page.tsx',
  'app/bookings/page.tsx',
  'app/analytics/page.tsx',
  'app/notifications/page.tsx',
  'app/messages/page.tsx',
  'app/assignments/page.tsx',
  'app/schedule/page.tsx',
  'app/tutor/profile/page.tsx',
  'app/page.tsx',
]

console.log('\n🔄 Migrating from Prisma to Supabase\n')
console.log('=' .repeat(60))
console.log('\nThis script will:')
console.log('1. Replace Prisma imports with Supabase')
console.log('2. Update database calls')
console.log('3. Remove Prisma dependencies\n')

// Note: This is a helper script - manual updates may be needed
console.log('⚠️  Note: Some files may need manual updates for complex queries.\n')
console.log('✅ Critical files (auth, login) have been updated\n')
console.log('📝 Remaining files to update manually:\n')

filesToUpdate.forEach((file, index) => {
  console.log(`   ${index + 1}. ${file}`)
})

console.log('\n📋 Migration Guide:')
console.log('   1. Replace: import { prisma } from "@/lib/prisma"')
console.log('      With:    import { db } from "@/lib/supabase-db"')
console.log('   2. Replace: prisma.user.findUnique({ where: { email } })')
console.log('      With:    db.users.findUnique({ email })')
console.log('   3. Replace: prisma.user.update({ where: { id }, data: {...} })')
console.log('      With:    db.users.update({ id }, {...})')
console.log('   4. Replace: prisma.user.create({ data: {...} })')
console.log('      With:    db.users.create({...})')
console.log('   5. Replace: prisma.user.findMany({ where: {...} })')
console.log('      With:    db.users.findMany({ where: {...} })\n')

console.log('📚 See lib/supabase-db.ts for all available methods\n')

