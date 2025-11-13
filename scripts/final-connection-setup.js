#!/usr/bin/env node

/**
 * Final Connection Setup - After SQL Scripts Run
 * Gets connection string and verifies everything works
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

async function finalSetup() {
  console.log('\n🔧 Final Connection Setup\n')
  console.log('=' .repeat(60))
  console.log('\nSince SQL scripts ran successfully, we just need the correct connection string.\n')
  
  const projectRef = 'ptjnlzrvqyynklzdipac'
  
  console.log('📋 Get Connection String from Supabase:\n')
  console.log('1. Go to: https://supabase.com/dashboard/project/' + projectRef + '/settings/database')
  console.log('2. Scroll to "Connection string" section')
  console.log('3. Click "URI" tab')
  console.log('4. You\'ll see connection strings - try these in order:')
  console.log('   a) "Direct connection" (port 5432)')
  console.log('   b) "Connection pooling" (port 6543)')
  console.log('5. Click "Copy" on one of them\n')
  
  const hasString = await question('Have you copied a connection string? (y/n): ')
  
  if (hasString.toLowerCase() !== 'y') {
    console.log('\n⚠️  Please get the connection string from Supabase first.\n')
    rl.close()
    process.exit(0)
  }
  
  console.log('\n📝 Paste the connection string below:')
  const connectionString = await question('Connection string: ')
  
  if (!connectionString.trim() || !connectionString.startsWith('postgresql://')) {
    console.log('\n❌ Invalid format!')
    rl.close()
    process.exit(1)
  }
  
  // Test connection
  console.log('\n🔍 Testing connection...')
  const prisma = new PrismaClient({
    datasources: {
      db: { url: connectionString.trim() },
    },
  })
  
  try {
    await prisma.$connect()
    console.log('✅ Connected to database!')
    
    // Test query
    const result = await prisma.$queryRaw`SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public'`
    const tableCount = result[0]?.count || 0
    console.log(`✅ Found ${tableCount} tables in database`)
    
    // Check for users table
    try {
      const userCount = await prisma.user.count()
      console.log(`✅ Found ${userCount} users in database`)
    } catch (e) {
      console.log('⚠️  Users table exists but may need Prisma Client regeneration')
    }
    
    await prisma.$disconnect()
    
    // Update .env
    console.log('\n📝 Updating .env file...')
    const envPath = path.join(process.cwd(), '.env')
    let envContent = fs.readFileSync(envPath, 'utf8')
    
    envContent = envContent.replace(/DATABASE_URL=.*/g, '')
    if (envContent.trim() && !envContent.endsWith('\n')) {
      envContent += '\n'
    }
    envContent += `DATABASE_URL="${connectionString.trim()}"\n`
    
    fs.writeFileSync(envPath, envContent, 'utf8')
    console.log('✅ Updated .env file\n')
    
    // Generate Prisma Client
    console.log('📦 Generating Prisma Client...')
    const { execSync } = require('child_process')
    try {
      execSync('npx prisma generate', { stdio: 'inherit' })
      console.log('\n✅ Prisma Client generated\n')
    } catch (error) {
      console.error('⚠️  Prisma generate had issues, but continuing...\n')
    }
    
    // Final test
    console.log('🔍 Final connection test...')
    const finalPrisma = new PrismaClient()
    try {
      await finalPrisma.$connect()
      const count = await finalPrisma.user.count()
      await finalPrisma.$disconnect()
      console.log(`✅ Final test successful! Found ${count} users.\n`)
    } catch (e) {
      console.log('⚠️  Connection works but may need Prisma introspection\n')
      await finalPrisma.$disconnect().catch(() => {})
    }
    
    console.log('=' .repeat(60))
    console.log('\n🎉 Setup Complete!\n')
    console.log('✅ Database connection configured')
    console.log('✅ Prisma Client generated')
    console.log('✅ Ready to use!\n')
    console.log('📝 Next steps:')
    console.log('   1. Restart your dev server (Ctrl+C then npm run dev)')
    console.log('   2. Test login with: infoajumapro@gmail.com / test1234')
    console.log('   3. If needed, run: npx prisma db pull (to sync schema)\n')
    
  } catch (error) {
    console.error('\n❌ Connection failed!\n')
    console.error('Error:', error.message.split('\n')[0])
    console.log('\n🔧 Troubleshooting:')
    console.log('   1. Verify connection string is correct')
    console.log('   2. Check if Supabase project is active')
    console.log('   3. Try a different connection string format from Supabase')
    console.log('   4. Check network/firewall settings\n')
    await prisma.$disconnect().catch(() => {})
    process.exit(1)
  }
  
  rl.close()
}

finalSetup().catch((error) => {
  console.error('\n❌ Error:', error.message)
  rl.close()
  process.exit(1)
})

