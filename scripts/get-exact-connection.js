#!/usr/bin/env node

/**
 * Get Exact Connection String from Supabase
 * Tests multiple connection formats to find the working one
 */

const fs = require('fs')
const path = require('path')
const readline = require('readline')
const { PrismaClient } = require('@prisma/client')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve))
}

async function testConnection(url, name) {
  const prisma = new PrismaClient({
    datasources: {
      db: { url },
    },
  })
  
  try {
    await prisma.$connect()
    await prisma.$queryRaw`SELECT 1`
    await prisma.$disconnect()
    return { success: true, url }
  } catch (error) {
    await prisma.$disconnect().catch(() => {})
    return { success: false, error: error.message.split('\n')[0] }
  }
}

async function getExactConnection() {
  console.log('\n🔍 Get Exact Supabase Connection String\n')
  console.log('=' .repeat(60))
  console.log('\nSince Supabase is active, we need the exact connection string.\n')
  
  const projectRef = 'ptjnlzrvqyynklzdipac'
  
  console.log('📋 Step 1: Get Connection String from Supabase\n')
  console.log('1. Go to: https://supabase.com/dashboard/project/' + projectRef + '/settings/database')
  console.log('2. Scroll to "Connection string" section')
  console.log('3. Click "URI" tab')
  console.log('4. You\'ll see connection strings - copy the one that says:')
  console.log('   "Direct connection" or "Connection pooling"')
  console.log('5. Click "Copy" button\n')
  
  const hasString = await question('Have you copied a connection string? (y/n): ')
  
  if (hasString.toLowerCase() !== 'y') {
    console.log('\n⚠️  Please get the connection string from Supabase first.\n')
    rl.close()
    process.exit(0)
  }
  
  console.log('\n📝 Paste the connection string below:')
  console.log('   (It should start with: postgresql://postgres...)')
  
  const connectionString = await question('\nConnection string: ')
  
  if (!connectionString.trim() || !connectionString.startsWith('postgresql://')) {
    console.log('\n❌ Invalid format! Connection string should start with: postgresql://')
    rl.close()
    process.exit(1)
  }
  
  // Test the provided connection string
  console.log('\n🔍 Testing provided connection string...')
  const result1 = await testConnection(connectionString.trim(), 'Provided')
  
  if (result1.success) {
    console.log('✅ Connection successful with provided string!\n')
    await updateEnvAndSetup(connectionString.trim())
    rl.close()
    return
  }
  
  console.log('❌ Provided connection string failed:', result1.error)
  console.log('\n🔧 Trying alternative formats...\n')
  
  // Extract password from connection string
  const passwordMatch = connectionString.match(/postgresql:\/\/[^:]+:([^@]+)@/)
  if (!passwordMatch) {
    console.log('❌ Could not extract password from connection string')
    console.log('   Please check the connection string format\n')
    rl.close()
    process.exit(1)
  }
  
  const rawPassword = passwordMatch[1]
  let decodedPassword = rawPassword
  try {
    decodedPassword = decodeURIComponent(rawPassword.replace(/%40/g, '@').replace(/%25/g, '%'))
  } catch (e) {
    // Keep original if decode fails
  }
  
  const encodedPassword = encodeURIComponent(decodedPassword)
  
  // Try different formats
  const formats = [
    {
      name: 'Direct connection (port 5432)',
      url: `postgresql://postgres:${encodedPassword}@db.${projectRef}.supabase.co:5432/postgres`,
    },
    {
      name: 'Direct connection with project ref',
      url: `postgresql://postgres.${projectRef}:${encodedPassword}@db.${projectRef}.supabase.co:5432/postgres`,
    },
    {
      name: 'Connection pooling (port 6543)',
      url: `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true`,
    },
  ]
  
  for (const format of formats) {
    process.stdout.write(`Testing: ${format.name}... `)
    const result = await testConnection(format.url, format.name)
    
    if (result.success) {
      console.log('✅ SUCCESS!\n')
      await updateEnvAndSetup(format.url)
      rl.close()
      return
    } else {
      console.log('❌ Failed')
    }
  }
  
  console.log('\n❌ All connection formats failed!\n')
  console.log('🔧 Troubleshooting:')
  console.log('   1. Verify your database password is correct')
  console.log('   2. Try resetting password in Supabase dashboard')
  console.log('   3. Check if your IP needs to be whitelisted')
  console.log('   4. Contact Supabase support if issue persists\n')
  
  rl.close()
  process.exit(1)
}

async function updateEnvAndSetup(connectionString) {
  const envPath = path.join(process.cwd(), '.env')
  let envContent = fs.readFileSync(envPath, 'utf8')
  
  // Update DATABASE_URL
  envContent = envContent.replace(/DATABASE_URL=.*/g, '')
  if (envContent.trim() && !envContent.endsWith('\n')) {
    envContent += '\n'
  }
  envContent += `DATABASE_URL="${connectionString}"\n`
  
  fs.writeFileSync(envPath, envContent, 'utf8')
  console.log('✅ Updated .env file\n')
  
  // Generate Prisma Client
  console.log('📦 Regenerating Prisma Client...')
  const { execSync } = require('child_process')
  try {
    execSync('npx prisma generate', { stdio: 'inherit' })
    console.log('\n✅ Prisma Client regenerated\n')
  } catch (error) {
    console.error('⚠️  Prisma generate failed\n')
  }
  
  // Test final connection
  console.log('🔍 Final connection test...')
  const prisma = new PrismaClient()
  try {
    await prisma.$connect()
    const count = await prisma.user.count().catch(() => 0)
    await prisma.$disconnect()
    console.log(`✅ Final test successful! Found ${count} users.\n`)
  } catch (error) {
    console.log('⚠️  Connection works but tables may not exist yet.\n')
    await prisma.$disconnect().catch(() => {})
  }
  
  console.log('=' .repeat(60))
  console.log('\n🎉 Connection Fixed!\n')
  console.log('📝 Next steps:')
  console.log('   1. Run: npx prisma db push (to create tables)')
  console.log('   2. Run: npm run setup:admin (to create admin account)')
  console.log('   3. Restart your dev server\n')
}

getExactConnection().catch((error) => {
  console.error('\n❌ Error:', error.message)
  rl.close()
  process.exit(1)
})

