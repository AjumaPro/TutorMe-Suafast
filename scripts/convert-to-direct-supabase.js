#!/usr/bin/env node

/**
 * Convert db.* calls to direct supabase.from() calls
 * This script helps identify patterns that need manual conversion
 */

const fs = require('fs')
const path = require('path')

const filesToCheck = [
  'app/api',
  'app/dashboard',
  'app/page.tsx',
]

console.log('\n🔄 Converting to Direct Supabase Queries\n')
console.log('=' .repeat(60))
console.log('\nThis script will update imports and basic patterns.\n')
console.log('⚠️  Note: Complex queries need manual updates.\n')

function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir)
  
  files.forEach(file => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    
    if (stat.isDirectory()) {
      findFiles(filePath, fileList)
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath)
    }
  })
  
  return fileList
}

let updated = 0
let errors = 0

// Find all TypeScript files
const allFiles = []
filesToCheck.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir)
  if (fs.existsSync(fullPath)) {
    findFiles(fullPath, allFiles)
  }
})

allFiles.forEach((filePath) => {
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    let changed = false
    
    // Replace import
    if (content.includes("from '@/lib/supabase-db'") && content.includes('{ db }')) {
      content = content.replace(/{ db }/g, '{ supabase }')
      changed = true
    }
    
    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8')
      console.log(`✅ Updated import: ${path.relative(process.cwd(), filePath)}`)
      updated++
    }
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message)
    errors++
  }
})

console.log('\n' + '=' .repeat(60))
console.log(`\n✅ Updated ${updated} files`)
if (errors > 0) {
  console.log(`⚠️  ${errors} errors`)
}
console.log('\n📝 Next steps:')
console.log('   Manually convert db.* calls to supabase.from() calls')
console.log('   Example:')
console.log('   db.users.findUnique({ email })')
console.log('   → supabase.from("users").select("*").eq("email", email).single()\n')

