#!/usr/bin/env node

/**
 * Complete Supabase Backend Setup
 * Gets connection string and configures everything
 */

const fs = require('fs')
const path = require('path')
const readline = require('readline')
const { execSync } = require('child_process')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve))
}

async function setupSupabaseBackend() {
  console.log('\n🚀 Supabase Backend Setup for Suafast\n')
  console.log('=' .repeat(60))
  console.log('\nThis will configure Supabase for your entire backend.\n')
  
  const projectRef = 'ptjnlzrvqyynklzdipac'
  const envPath = path.join(process.cwd(), '.env')
  
  // Check if .env exists
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found!')
    process.exit(1)
  }
  
  let envContent = fs.readFileSync(envPath, 'utf8')
  
  console.log('📋 Step 1: Get Supabase Connection String\n')
  console.log('⚠️  IMPORTANT: You need to get the connection string from Supabase dashboard.\n')
  console.log('1. Go to: https://supabase.com/dashboard/project/' + projectRef + '/settings/database')
  console.log('2. Scroll to "Connection string" section')
  console.log('3. Click "URI" tab')
  console.log('4. Click "Copy" button (copies entire connection string)\n')
  console.log('⚠️  Make sure your Supabase project is ACTIVE (not paused)\n')
  
  const hasConnectionString = await question('Have you copied the connection string? (y/n): ')
  
  if (hasConnectionString.toLowerCase() !== 'y') {
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
  
  // Test connection
  console.log('\n🔍 Testing connection...')
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
  } catch (error) {
    console.error('\n❌ Connection failed!\n')
    console.error('Error:', error.message.split('\n')[0])
    console.log('\n🔧 Troubleshooting:')
    console.log('   1. Check if Supabase project is active (not paused)')
    console.log('   2. Go to: https://supabase.com/dashboard/project/' + projectRef)
    console.log('   3. If paused, click "Restore" and wait 2-3 minutes')
    console.log('   4. Verify connection string is correct\n')
    await prisma.$disconnect().catch(() => {})
    rl.close()
    process.exit(1)
  }
  
  // Update .env file
  console.log('📝 Updating .env file...')
  
  // Remove old DATABASE_URL
  envContent = envContent.replace(/DATABASE_URL=.*/g, '')
  
  // Add new DATABASE_URL
  if (envContent.trim() && !envContent.endsWith('\n')) {
    envContent += '\n'
  }
  envContent += `DATABASE_URL="${connectionString.trim()}"\n`
  
  // Add Supabase environment variables (if not present)
  if (!envContent.includes('NEXT_PUBLIC_SUPABASE_URL')) {
    console.log('\n📝 Supabase Project URL:')
    console.log('   Go to: https://supabase.com/dashboard/project/' + projectRef + '/settings/api')
    console.log('   Copy the "Project URL"\n')
    
    const supabaseUrl = await question('Enter Supabase Project URL (or press Enter to skip): ')
    if (supabaseUrl.trim()) {
      envContent += `NEXT_PUBLIC_SUPABASE_URL="${supabaseUrl.trim()}"\n`
    }
    
    console.log('\n📝 Supabase Anon Key:')
    console.log('   In the same page, copy the "anon public" key\n')
    
    const supabaseKey = await question('Enter Supabase Anon Key (or press Enter to skip): ')
    if (supabaseKey.trim()) {
      envContent += `NEXT_PUBLIC_SUPABASE_ANON_KEY="${supabaseKey.trim()}"\n`
    }
  }
  
  fs.writeFileSync(envPath, envContent, 'utf8')
  console.log('\n✅ Updated .env file\n')
  
  // Generate Prisma Client
  console.log('📦 Generating Prisma Client for PostgreSQL...')
  try {
    execSync('npx prisma generate', { stdio: 'inherit' })
    console.log('✅ Prisma Client generated\n')
  } catch (error) {
    console.error('❌ Failed to generate Prisma Client')
    rl.close()
    process.exit(1)
  }
  
  // Push schema to database
  console.log('📊 Pushing database schema to Supabase...')
  const pushSchema = await question('Push schema to database? (y/n): ')
  
  if (pushSchema.toLowerCase() === 'y') {
    try {
      execSync('npx prisma db push', { stdio: 'inherit' })
      console.log('\n✅ Database schema pushed successfully!\n')
    } catch (error) {
      console.error('\n⚠️  Schema push failed. You can try again later with: npx prisma db push\n')
    }
  }
  
  // Create admin account
  console.log('👤 Admin Account Setup:')
  const setupAdmin = await question('Create admin account? (y/n): ')
  
  if (setupAdmin.toLowerCase() === 'y') {
    try {
      execSync('npm run setup:admin', { stdio: 'inherit' })
    } catch (error) {
      console.error('\n⚠️  Admin setup failed. You can run it later with: npm run setup:admin\n')
    }
  }
  
  console.log('=' .repeat(60))
  console.log('\n🎉 Supabase Backend Setup Complete!\n')
  console.log('✅ Database connection configured')
  console.log('✅ Prisma Client generated')
  console.log('✅ Ready to use!\n')
  console.log('📝 Next steps:')
  console.log('   1. Restart your dev server (Ctrl+C then npm run dev)')
  console.log('   2. Test login functionality')
  console.log('   3. If schema wasn\'t pushed, run: npx prisma db push')
  console.log('   4. If admin wasn\'t created, run: npm run setup:admin\n')
  
  rl.close()
}

setupSupabaseBackend().catch((error) => {
  console.error('\n❌ Error:', error.message)
  rl.close()
  process.exit(1)
})

