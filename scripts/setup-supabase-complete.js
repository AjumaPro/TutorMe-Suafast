#!/usr/bin/env node

/**
 * Complete Supabase Setup Script
 * Handles connection string configuration and database initialization
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
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

async function testConnection(connectionString) {
  const { PrismaClient } = require('@prisma/client')
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: connectionString,
      },
    },
  })

  try {
    await prisma.$connect()
    const count = await prisma.user.count()
    await prisma.$disconnect()
    return { success: true, message: `Connected! Found ${count} users.` }
  } catch (error) {
    await prisma.$disconnect().catch(() => {})
    return { success: false, message: error.message }
  }
}

async function setupSupabase() {
  console.log('\n🚀 Complete Supabase Setup for Suafast\n')
  console.log('=' .repeat(60))
  console.log('\nThis script will help you configure and test your Supabase connection.\n')

  const projectRef = 'ptjnlzrvqyynklzdipac'
  const envPath = path.join(process.cwd(), '.env')

  // Check if .env exists
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found!')
    process.exit(1)
  }

  let envContent = fs.readFileSync(envPath, 'utf8')

  console.log('📋 Supabase Project Information:')
  console.log(`   Project Reference: ${projectRef}`)
  console.log(`   Dashboard: https://supabase.com/dashboard/project/${projectRef}\n`)

  console.log('⚠️  IMPORTANT: Before continuing, please check:')
  console.log('   1. Is your Supabase project ACTIVE? (not paused)')
  console.log('   2. Do you have your database password ready?')
  console.log('   3. Password can be found at: Settings → Database → Database password\n')

  const proceed = await question('Do you want to continue? (y/n): ')
  if (proceed.toLowerCase() !== 'y') {
    console.log('\nExiting...')
    rl.close()
    process.exit(0)
  }

  // Get password
  console.log('\n📝 Database Password:')
  console.log('   Go to: https://supabase.com/dashboard/project/' + projectRef + '/settings/database')
  console.log('   Scroll to "Database password" section\n')
  
  const password = await question('Enter your database password: ')

  if (!password.trim()) {
    console.log('\n❌ Password is required. Exiting...')
    rl.close()
    process.exit(1)
  }

  const encodedPassword = urlEncodePassword(password.trim())

  // Try different connection string formats
  const connectionStrings = [
    {
      name: 'Direct connection (port 5432)',
      url: `postgresql://postgres:${encodedPassword}@db.${projectRef}.supabase.co:5432/postgres`,
    },
    {
      name: 'Connection pooling (port 6543)',
      url: `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true`,
    },
    {
      name: 'Connection pooling with limit (port 6543)',
      url: `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1`,
    },
  ]

  console.log('\n🔍 Testing connection methods...\n')

  let workingConnection = null

  for (const conn of connectionStrings) {
    console.log(`Testing: ${conn.name}...`)
    const result = await testConnection(conn.url)
    
    if (result.success) {
      console.log(`✅ ${result.message}\n`)
      workingConnection = conn.url
      break
    } else {
      console.log(`❌ Failed: ${result.message.split('\n')[0]}\n`)
    }
  }

  if (!workingConnection) {
    console.log('❌ All connection methods failed!\n')
    console.log('🔧 Troubleshooting:')
    console.log('   1. Verify your password is correct')
    console.log('   2. Check if Supabase project is active (not paused)')
    console.log('   3. Go to Supabase dashboard and check project status')
    console.log('   4. Try resetting your database password\n')
    rl.close()
    process.exit(1)
  }

  // Update .env file
  console.log('📝 Updating .env file...')
  envContent = envContent.replace(/DATABASE_URL=.*/g, '')
  if (envContent.trim() && !envContent.endsWith('\n')) {
    envContent += '\n'
  }
  envContent += `DATABASE_URL="${workingConnection}"\n`

  fs.writeFileSync(envPath, envContent, 'utf8')
  console.log('✅ Updated .env file\n')

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
  const pushSchema = await question('Do you want to push the schema now? (y/n): ')
  
  if (pushSchema.toLowerCase() === 'y') {
    try {
      execSync('npx prisma db push', { stdio: 'inherit' })
      console.log('\n✅ Database schema pushed successfully!\n')
    } catch (error) {
      console.error('\n❌ Failed to push schema. You can try again later with: npx prisma db push\n')
    }
  }

  // Create admin account
  console.log('👤 Admin Account Setup:')
  const setupAdmin = await question('Do you want to create the admin account now? (y/n): ')
  
  if (setupAdmin.toLowerCase() === 'y') {
    try {
      execSync('npm run setup:admin', { stdio: 'inherit' })
    } catch (error) {
      console.error('\n⚠️  Admin setup failed. You can run it later with: npm run setup:admin\n')
    }
  }

  console.log('\n' + '=' .repeat(60))
  console.log('\n🎉 Supabase setup complete!\n')
  console.log('✅ Connection string configured')
  console.log('✅ Prisma Client generated')
  console.log('✅ Ready to use Supabase database\n')
  console.log('📝 Next steps:')
  console.log('   1. If schema wasn\'t pushed, run: npx prisma db push')
  console.log('   2. If admin wasn\'t created, run: npm run setup:admin')
  console.log('   3. Test your app: npm run dev\n')

  rl.close()
}

setupSupabase().catch((error) => {
  console.error('\n❌ Error:', error.message)
  rl.close()
  process.exit(1)
})

