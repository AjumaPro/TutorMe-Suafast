#!/usr/bin/env node

/**
 * Diagnose Supabase Connection Issues
 * Tests connection and provides detailed diagnostics
 */

const { PrismaClient } = require('@prisma/client')
const dns = require('dns').promises

async function diagnoseConnection() {
  console.log('\n🔍 Supabase Connection Diagnostics\n')
  console.log('=' .repeat(60))
  
  const projectRef = 'ptjnlzrvqyynklzdipac'
  const host = `db.${projectRef}.supabase.co`
  
  // Test 1: DNS Resolution
  console.log('\nTest 1: DNS Resolution')
  try {
    const addresses = await dns.resolve4(host)
    console.log(`✅ DNS resolved: ${host} -> ${addresses[0]}`)
  } catch (error) {
    console.log(`❌ DNS resolution failed: ${error.message}`)
    console.log('   This might indicate network issues or wrong hostname')
    return
  }
  
  // Test 2: Check connection string format
  console.log('\nTest 2: Connection String Format')
  const password = 'Bakertilly@2019'
  const encodedPassword = encodeURIComponent(password)
  const connectionString = `postgresql://postgres:${encodedPassword}@${host}:5432/postgres`
  console.log(`Connection string: ${connectionString.replace(/:[^:@]+@/, ':****@')}`)
  console.log(`Password encoding: ${password} -> ${encodedPassword}`)
  
  // Test 3: Try connection
  console.log('\nTest 3: Database Connection')
  const prisma = new PrismaClient({
    datasources: {
      db: { url: connectionString },
    },
  })
  
  try {
    console.log('Attempting to connect...')
    await prisma.$connect()
    console.log('✅ Connection successful!')
    
    // Test query
    try {
      const result = await prisma.$queryRaw`SELECT version()`
      console.log('✅ Database query successful')
      console.log(`   PostgreSQL version: ${result[0]?.version || 'Unknown'}`)
    } catch (e) {
      console.log('⚠️  Connected but query failed:', e.message)
    }
    
    await prisma.$disconnect()
    
  } catch (error) {
    console.log('❌ Connection failed!')
    console.log(`   Error: ${error.message.split('\n')[0]}`)
    
    // Provide specific troubleshooting based on error
    if (error.message.includes("Can't reach database server")) {
      console.log('\n🔧 Troubleshooting for "Can\'t reach database server":')
      console.log('   1. Check if Supabase project is actually active:')
      console.log(`      https://supabase.com/dashboard/project/${projectRef}`)
      console.log('   2. Check if your IP is whitelisted:')
      console.log(`      https://supabase.com/dashboard/project/${projectRef}/settings/database`)
      console.log('      Go to "Network restrictions" section')
      console.log('   3. Try using Supabase connection pooler (port 6543)')
      console.log('   4. Verify database password is correct')
      console.log('   5. Check Supabase status page: https://status.supabase.com/')
    } else if (error.message.includes('password authentication failed')) {
      console.log('\n🔧 Troubleshooting for "password authentication failed":')
      console.log('   1. Password is incorrect')
      console.log('   2. Reset password in Supabase dashboard:')
      console.log(`      https://supabase.com/dashboard/project/${projectRef}/settings/database`)
      console.log('   3. Get new connection string after resetting password')
    } else if (error.message.includes('Tenant or user not found')) {
      console.log('\n🔧 Troubleshooting for "Tenant or user not found":')
      console.log('   1. Connection pooling format is wrong')
      console.log('   2. Use direct connection (port 5432) instead')
      console.log('   3. Or get exact connection string from Supabase dashboard')
    }
    
    await prisma.$disconnect().catch(() => {})
  }
  
  // Test 4: Alternative connection formats
  console.log('\nTest 4: Alternative Connection Formats')
  const alternatives = [
    {
      name: 'Direct connection (current)',
      url: `postgresql://postgres:${encodedPassword}@${host}:5432/postgres`,
    },
    {
      name: 'Connection pooling',
      url: `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true`,
    },
  ]
  
  for (const alt of alternatives) {
    const testPrisma = new PrismaClient({
      datasources: { db: { url: alt.url } },
    })
    
    try {
      await testPrisma.$connect()
      await testPrisma.$queryRaw`SELECT 1`
      console.log(`✅ ${alt.name}: SUCCESS`)
      await testPrisma.$disconnect()
      break
    } catch (e) {
      console.log(`❌ ${alt.name}: ${e.message.split('\n')[0]}`)
      await testPrisma.$disconnect().catch(() => {})
    }
  }
  
  console.log('\n' + '=' .repeat(60))
  console.log('\n📝 Recommendations:')
  console.log('   1. Verify Supabase project is active (not paused)')
  console.log('   2. Check IP restrictions in Supabase dashboard')
  console.log('   3. Get connection string directly from Supabase dashboard')
  console.log('   4. Try resetting database password')
  console.log('   5. Check Supabase status: https://status.supabase.com/\n')
}

diagnoseConnection().catch(console.error)

