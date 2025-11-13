#!/usr/bin/env node

/**
 * Update Connection String to Use Supabase Pooler
 * Fixes the connection string format to use port 6543 with connection pooling
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

function urlEncodePassword(password) {
  return password
    .replace(/%/g, '%25')
    .replace(/@/g, '%40')
    .replace(/#/g, '%23')
    .replace(/\$/g, '%24')
    .replace(/&/g, '%26')
    .replace(/\+/g, '%2B')
    .replace(/=/g, '%3D')
    .replace(/\?/g, '%3F')
    .replace(/\//g, '%2F')
    .replace(/:/g, '%3A')
}

async function updateConnectionString() {
  console.log('\n🔧 Update Supabase Connection String\n')
  console.log('=' .repeat(60))
  
  const envPath = path.join(process.cwd(), '.env')
  const envContent = fs.readFileSync(envPath, 'utf8')
  
  // Extract current password
  const match = envContent.match(/DATABASE_URL="postgresql:\/\/postgres:([^@]+)@/)
  if (!match) {
    console.error('❌ Could not parse current DATABASE_URL')
    process.exit(1)
  }
  
  const rawPassword = match[1]
  // Decode password to get original
  let decodedPassword = rawPassword
  try {
    decodedPassword = decodeURIComponent(rawPassword.replace(/%40/g, '@').replace(/%25/g, '%'))
  } catch (e) {
    // If decoding fails, use as is
  }
  
  const projectRef = 'ptjnlzrvqyynklzdipac'
  const encodedPassword = urlEncodePassword(decodedPassword)
  
  console.log('\n📋 Current connection uses port 5432 (direct connection)')
  console.log('   Supabase recommends port 6543 (connection pooling) for applications\n')
  
  console.log('⚠️  IMPORTANT: The best way is to get the connection string from Supabase dashboard.\n')
  console.log('   Go to: https://supabase.com/dashboard/project/' + projectRef + '/settings/database')
  console.log('   Click "URI" tab and copy the connection string\n')
  
  const useDashboard = await question('Do you want to paste the connection string from Supabase dashboard? (y/n): ')
  
  let workingConnection = null
  
  if (useDashboard.toLowerCase() === 'y') {
    console.log('\n📝 Paste the connection string from Supabase dashboard:')
    const dashboardString = await question('Connection string: ')
    
    if (dashboardString.trim() && dashboardString.startsWith('postgresql://')) {
      workingConnection = dashboardString.trim()
      console.log('\n✅ Using connection string from Supabase dashboard\n')
    } else {
      console.log('\n⚠️  Invalid format, trying alternative formats...\n')
    }
  }
  
  // If no dashboard string, try connection pooling format
  if (!workingConnection) {
    console.log('\n🔧 Trying connection pooling format (port 6543)...\n')
    workingConnection = `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true`
  }
  
  // Update .env file
  console.log('📝 Updating .env file...')
  let updatedEnv = envContent.replace(/DATABASE_URL=.*/g, '')
  if (updatedEnv.trim() && !updatedEnv.endsWith('\n')) {
    updatedEnv += '\n'
  }
  updatedEnv += `DATABASE_URL="${workingConnection}"\n`
  
  fs.writeFileSync(envPath, updatedEnv, 'utf8')
  console.log('✅ Updated .env file\n')
  
  // Test the connection
  console.log('🔍 Testing connection...')
  const { PrismaClient } = require('@prisma/client')
  const prisma = new PrismaClient()
  
  try {
    await prisma.$connect()
    const count = await prisma.user.count()
    await prisma.$disconnect()
    console.log(`✅ Connection successful! Found ${count} users in database.\n`)
    
    console.log('=' .repeat(60))
    console.log('\n🎉 Connection fixed!\n')
    console.log('📝 Next steps:')
    console.log('   1. Run: npx prisma generate')
    console.log('   2. Run: npx prisma db push')
    console.log('   3. Run: npm run setup:admin')
    console.log('   4. Restart your dev server\n')
    
  } catch (error) {
    console.error('\n❌ Connection test failed!\n')
    console.error('Error:', error.message.split('\n')[0])
    console.log('\n🔧 Troubleshooting:')
    console.log('   1. Check if Supabase project is active (not paused)')
    console.log('   2. Go to: https://supabase.com/dashboard/project/' + projectRef)
    console.log('   3. If paused, click "Restore" and wait 2-3 minutes')
    console.log('   4. Get connection string from: Settings → Database → Connection string → URI')
    console.log('   5. Run: npm run fix:login\n')
    await prisma.$disconnect().catch(() => {})
    process.exit(1)
  }
  
  rl.close()
}

updateConnectionString().catch((error) => {
  console.error('\n❌ Error:', error.message)
  rl.close()
  process.exit(1)
})

