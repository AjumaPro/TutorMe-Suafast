#!/usr/bin/env node

/**
 * Fix Login Connection - Quick Fix Script
 * Helps fix Supabase connection for login to work
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

async function fixConnection() {
  console.log('\n🔧 Fix Login Connection Error\n')
  console.log('=' .repeat(60))
  console.log('\nThe login error is caused by database connection failure.\n')
  
  const projectRef = 'ptjnlzrvqyynklzdipac'
  const dashboardUrl = `https://supabase.com/dashboard/project/${projectRef}/settings/database`
  
  console.log('📋 To fix this, you need to get the connection string from Supabase:\n')
  console.log('1. Open: ' + dashboardUrl)
  console.log('2. Scroll to "Connection string" section')
  console.log('3. Click "URI" tab')
  console.log('4. Click "Copy" button (copies entire connection string)\n')
  
  const hasString = await question('Have you copied the connection string? (y/n): ')
  
  if (hasString.toLowerCase() !== 'y') {
    console.log('\n⚠️  Please get the connection string from Supabase first.')
    console.log('   Then run this script again.\n')
    rl.close()
    process.exit(0)
  }
  
  console.log('\n📝 Paste the connection string below:')
  console.log('   (Should start with: postgresql://postgres...)')
  
  const connectionString = await question('\nConnection string: ')
  
  if (!connectionString.trim() || !connectionString.startsWith('postgresql://')) {
    console.log('\n❌ Invalid format! Connection string should start with: postgresql://')
    rl.close()
    process.exit(1)
  }
  
  // Update .env
  const envPath = path.join(process.cwd(), '.env')
  let envContent = fs.readFileSync(envPath, 'utf8')
  
  envContent = envContent.replace(/DATABASE_URL=.*/g, '')
  if (envContent.trim() && !envContent.endsWith('\n')) {
    envContent += '\n'
  }
  envContent += `DATABASE_URL="${connectionString.trim()}"\n`
  
  fs.writeFileSync(envPath, envContent, 'utf8')
  console.log('\n✅ Updated .env file\n')
  
  // Test connection
  console.log('🔍 Testing connection...')
  const { PrismaClient } = require('@prisma/client')
  const prisma = new PrismaClient({
    datasources: {
      db: { url: connectionString.trim() },
    },
  })
  
  try {
    await prisma.$connect()
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ Connection successful!\n')
    
    await prisma.$disconnect()
    
    // Generate Prisma Client
    console.log('📦 Generating Prisma Client...')
    const { execSync } = require('child_process')
    execSync('npx prisma generate', { stdio: 'inherit' })
    console.log('\n✅ Prisma Client generated\n')
    
    // Push schema
    console.log('📊 Pushing database schema...')
    const pushSchema = await question('Push schema to database? (y/n): ')
    
    if (pushSchema.toLowerCase() === 'y') {
      try {
        execSync('npx prisma db push', { stdio: 'inherit' })
        console.log('\n✅ Schema pushed!\n')
      } catch (error) {
        console.error('\n⚠️  Schema push failed. Run: npx prisma db push\n')
      }
    }
    
    // Create admin
    console.log('👤 Creating admin account...')
    const createAdmin = await question('Create admin account? (y/n): ')
    
    if (createAdmin.toLowerCase() === 'y') {
      try {
        execSync('npm run setup:admin', { stdio: 'inherit' })
      } catch (error) {
        console.error('\n⚠️  Admin setup failed. Run: npm run setup:admin\n')
      }
    }
    
    console.log('=' .repeat(60))
    console.log('\n🎉 Setup Complete!\n')
    console.log('✅ Connection fixed')
    console.log('✅ Prisma Client generated')
    console.log('✅ Ready to login!\n')
    console.log('📝 Next step: Restart your dev server (Ctrl+C then npm run dev)\n')
    
  } catch (error) {
    console.error('\n❌ Connection failed!\n')
    console.error('Error:', error.message.split('\n')[0])
    console.log('\n🔧 Troubleshooting:')
    console.log('   1. Check if Supabase project is active (not paused)')
    console.log('   2. Verify connection string is correct')
    console.log('   3. Try resetting database password in Supabase\n')
    await prisma.$disconnect().catch(() => {})
    process.exit(1)
  }
  
  rl.close()
}

fixConnection().catch((error) => {
  console.error('\n❌ Error:', error.message)
  rl.close()
  process.exit(1)
})

