#!/usr/bin/env node

/**
 * Test Supabase Database Connection
 * Helps diagnose connection issues
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testConnection() {
  console.log('\n🔍 Testing Supabase Database Connection...\n')
  console.log('=' .repeat(50))

  try {
    // Test 1: Basic connection
    console.log('Test 1: Testing basic connection...')
    await prisma.$connect()
    console.log('✅ Successfully connected to database\n')

    // Test 2: Query database
    console.log('Test 2: Querying database...')
    const userCount = await prisma.user.count()
    console.log(`✅ Database is accessible. Found ${userCount} users\n`)

    // Test 3: Check if tables exist
    console.log('Test 3: Checking database schema...')
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `
    console.log(`✅ Found ${tables.length} tables:`)
    tables.forEach((table) => {
      console.log(`   - ${table.table_name}`)
    })
    console.log('')

    console.log('🎉 All connection tests passed!\n')
    console.log('Your Supabase database is properly configured.\n')

  } catch (error) {
    console.error('\n❌ Connection test failed!\n')
    console.error('Error:', error.message)
    console.error('\n')

    if (error.message.includes("Can't reach database server")) {
      console.log('🔧 Troubleshooting steps:')
      console.log('   1. Check if your Supabase project is active (not paused)')
      console.log('   2. Verify your database password is correct')
      console.log('   3. Make sure special characters in password are URL-encoded:')
      console.log('      - @ → %40')
      console.log('      - # → %23')
      console.log('      - $ → %24')
      console.log('      - & → %26')
      console.log('   4. Try using port 6543 instead of 5432 (connection pooling)')
      console.log('   5. Check your .env file DATABASE_URL format\n')
    } else if (error.message.includes('password authentication failed')) {
      console.log('🔧 Password authentication failed:')
      console.log('   1. Go to Supabase dashboard')
      console.log('   2. Settings → Database')
      console.log('   3. Reset your database password')
      console.log('   4. Update .env with new password (URL-encode special chars)\n')
    } else if (error.message.includes('does not exist')) {
      console.log('🔧 Database schema not found:')
      console.log('   1. Run: npx prisma generate')
      console.log('   2. Run: npx prisma db push\n')
    }

    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()

