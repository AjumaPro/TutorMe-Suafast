#!/usr/bin/env node

/**
 * Replace Prisma with Supabase in all files
 * This script helps update imports and basic patterns
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
  'app/api/bookings/route.ts',
  'app/api/payments/initialize/route.ts',
  'app/api/payments/verify/route.ts',
  'app/api/payments/webhook/route.ts',
  'app/api/messages/route.ts',
  'app/api/notifications/route.ts',
  'app/api/reviews/route.ts',
  'app/api/addresses/route.ts',
  'app/api/assignments/route.ts',
  'app/api/progress/route.ts',
  'app/api/tutor/profile/route.ts',
  'app/api/availability/route.ts',
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

console.log('\n🔄 Replacing Prisma with Supabase\n')
console.log('=' .repeat(60))
console.log('\nThis script will update imports in files.\n')
console.log('⚠️  Note: Complex queries may need manual updates.\n')

let updated = 0
let errors = 0

filesToUpdate.forEach((file) => {
  const filePath = path.join(process.cwd(), file)
  
  if (!fs.existsSync(filePath)) {
    console.log(`⏭️  Skipping (not found): ${file}`)
    return
  }
  
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    let changed = false
    
    // Replace import
    if (content.includes("from '@/lib/prisma'") || content.includes('from "@/lib/prisma"')) {
      content = content.replace(/from ['"]@\/lib\/prisma['"]/g, "from '@/lib/supabase-db'")
      content = content.replace(/import \{ prisma \}/g, "import { db }")
      content = content.replace(/import.*prisma.*from/g, "import { db } from")
      changed = true
    }
    
    // Replace require
    if (content.includes("require('@/lib/prisma')") || content.includes('require("@/lib/prisma")')) {
      content = content.replace(/require\(['"]@\/lib\/prisma['"]\)/g, "require('@/lib/supabase-db')")
      content = content.replace(/const \{ prisma \}/g, "const { db }")
      changed = true
    }
    
    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8')
      console.log(`✅ Updated: ${file}`)
      updated++
    } else {
      console.log(`⏭️  No changes: ${file}`)
    }
  } catch (error) {
    console.error(`❌ Error updating ${file}:`, error.message)
    errors++
  }
})

console.log('\n' + '=' .repeat(60))
console.log(`\n✅ Updated ${updated} files`)
if (errors > 0) {
  console.log(`⚠️  ${errors} errors`)
}
console.log('\n📝 Next steps:')
console.log('   1. Review updated files')
console.log('   2. Update database calls (prisma.* → db.*)')
console.log('   3. Fix complex queries manually')
console.log('   4. Test the application\n')

