#!/usr/bin/env node

/**
 * Supabase Setup Script
 * Helps configure Supabase database connection
 */

const fs = require('fs')
const path = require('path')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve))
}

async function setupSupabase() {
  console.log('\n🚀 Supabase Setup for Suafast\n')
  console.log('=' .repeat(50))
  console.log('\nThis script will help you configure Supabase for your application.\n')

  // Check if .env exists
  const envPath = path.join(process.cwd(), '.env')
  let envContent = ''
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8')
  } else {
    console.log('⚠️  No .env file found. Creating one...\n')
  }

  console.log('📋 You need the following information from Supabase:')
  console.log('   1. Project Reference ID (e.g., ptjnlzrvqyynklzdipac)')
  console.log('   2. Database Password\n')

  const hasProjectRef = envContent.includes('ptjnlzrvqyynklzdipac')
  let projectRef = 'ptjnlzrvqyynklzdipac'
  
  if (!hasProjectRef) {
    const inputRef = await question('Enter your Supabase Project Reference ID (or press Enter to use default): ')
    if (inputRef.trim()) {
      projectRef = inputRef.trim()
    }
  } else {
    console.log(`✅ Found project reference: ${projectRef}`)
  }

  console.log('\n📝 Getting Database Password:')
  console.log('   1. Go to: https://supabase.com/dashboard/project/' + projectRef + '/settings/database')
  console.log('   2. Scroll to "Database password" section')
  console.log('   3. Copy your password (or reset it if needed)\n')

  const password = await question('Enter your Supabase database password: ')

  if (!password.trim()) {
    console.log('\n❌ Password is required. Exiting...')
    rl.close()
    process.exit(1)
  }

  // Construct connection string
  const connectionString = `postgresql://postgres:${password.trim()}@db.${projectRef}.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1`

  // Update .env file
  let updatedEnv = envContent

  // Remove old DATABASE_URL if exists
  updatedEnv = updatedEnv.replace(/DATABASE_URL=.*/g, '')
  
  // Add new DATABASE_URL
  if (updatedEnv.trim() && !updatedEnv.endsWith('\n')) {
    updatedEnv += '\n'
  }
  updatedEnv += `DATABASE_URL="${connectionString}"\n`

  // Write to .env
  fs.writeFileSync(envPath, updatedEnv, 'utf8')

  console.log('\n✅ Updated .env file with Supabase connection string')
  console.log('\n📦 Next steps:')
  console.log('   1. Run: npx prisma generate')
  console.log('   2. Run: npx prisma db push')
  console.log('   3. Run: npm run setup:admin (to create admin account)')
  console.log('\n✨ Setup complete! Your database is now configured for Supabase.\n')

  rl.close()
}

setupSupabase().catch((error) => {
  console.error('\n❌ Error:', error.message)
  rl.close()
  process.exit(1)
})

