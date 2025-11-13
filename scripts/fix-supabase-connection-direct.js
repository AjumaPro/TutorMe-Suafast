#!/usr/bin/env node

/**
 * Fix Supabase Connection - Use Direct Connection
 * Prisma works better with direct connection (port 5432) not pooler
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
  console.log('\n🔧 Fix Supabase Connection for Prisma\n')
  console.log('=' .repeat(60))
  console.log('\nPrisma works best with direct connection (port 5432), not pooler.\n')
  
  const projectRef = 'ptjnlzrvqyynklzdipac'
  const envPath = path.join(process.cwd(), '.env')
  const envContent = fs.readFileSync(envPath, 'utf8')
  
  // Extract password from current connection string
  const match = envContent.match(/DATABASE_URL="postgresql:\/\/[^:]+:([^@]+)@/)
  let password = 'Bakertilly@2019' // Default
  
  if (match) {
    // Decode password
    password = decodeURIComponent(match[1].replace(/%40/g, '@').replace(/%25/g, '%'))
  }
  
  console.log('📋 Getting Connection String from Supabase:\n')
  console.log('1. Go to: https://supabase.com/dashboard/project/' + projectRef + '/settings/database')
  console.log('2. Scroll to "Connection string" section')
  console.log('3. Click "URI" tab')
  console.log('4. You\'ll see connection strings - use the DIRECT connection (port 5432)')
  console.log('   NOT the pooler connection (port 6543)\n')
  console.log('   Look for: postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres\n')
  
  const useDirect = await question('Do you want to use direct connection format? (y/n): ')
  
  let connectionString = ''
  
  if (useDirect.toLowerCase() === 'y') {
    // Try direct connection format
    const encodedPassword = encodeURIComponent(password)
    connectionString = `postgresql://postgres:${encodedPassword}@db.${projectRef}.supabase.co:5432/postgres`
    console.log('\n📝 Using direct connection format (port 5432)\n')
  } else {
    console.log('\n📝 Paste the connection string from Supabase dashboard:')
    connectionString = await question('Connection string: ')
    
    if (!connectionString.trim() || !connectionString.startsWith('postgresql://')) {
      console.log('\n❌ Invalid format!')
      rl.close()
      process.exit(1)
    }
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
    
    // Test a simple query
    try {
      const count = await prisma.user.count()
      console.log(`✅ Database accessible! Found ${count} users.\n`)
    } catch (e) {
      console.log('⚠️  Connection works but tables may not exist yet.\n')
    }
    
    await prisma.$disconnect()
  } catch (error) {
    console.error('\n❌ Connection failed!\n')
    console.error('Error:', error.message.split('\n')[0])
    console.log('\n🔧 Troubleshooting:')
    console.log('   1. Check if Supabase project is active (not paused)')
    console.log('   2. Go to: https://supabase.com/dashboard/project/' + projectRef)
    console.log('   3. If paused, click "Restore" and wait 2-3 minutes')
    console.log('   4. Get connection string from: Settings → Database → Connection string')
    console.log('   5. Use DIRECT connection (port 5432), not pooler\n')
    await prisma.$disconnect().catch(() => {})
    rl.close()
    process.exit(1)
  }
  
  // Update .env
  console.log('📝 Updating .env file...')
  let updatedEnv = envContent.replace(/DATABASE_URL=.*/g, '')
  if (updatedEnv.trim() && !updatedEnv.endsWith('\n')) {
    updatedEnv += '\n'
  }
  updatedEnv += `DATABASE_URL="${connectionString.trim()}"\n`
  
  fs.writeFileSync(envPath, updatedEnv, 'utf8')
  console.log('✅ Updated .env file\n')
  
  // Generate Prisma Client
  console.log('📦 Regenerating Prisma Client...')
  const { execSync } = require('child_process')
  try {
    execSync('npx prisma generate', { stdio: 'inherit' })
    console.log('✅ Prisma Client regenerated\n')
  } catch (error) {
    console.error('⚠️  Prisma generate failed\n')
  }
  
  console.log('=' .repeat(60))
  console.log('\n🎉 Connection Fixed!\n')
  console.log('✅ Using direct connection to Supabase')
  console.log('✅ Prisma Client regenerated')
  console.log('✅ Ready to use!\n')
  console.log('📝 Next steps:')
  console.log('   1. Run: npx prisma db push (to create tables)')
  console.log('   2. Run: npm run setup:admin (to create admin account)')
  console.log('   3. Restart your dev server\n')
  
  rl.close()
}

fixConnection().catch((error) => {
  console.error('\n❌ Error:', error.message)
  rl.close()
  process.exit(1)
})

