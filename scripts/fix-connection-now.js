#!/usr/bin/env node

/**
 * Quick Fix for Supabase Connection
 * Tries common connection string formats
 */

const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')

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

async function testConnection(url) {
  const prisma = new PrismaClient({
    datasources: {
      db: { url },
    },
  })
  
  try {
    await prisma.$connect()
    await prisma.$queryRaw`SELECT 1`
    await prisma.$disconnect()
    return true
  } catch (error) {
    await prisma.$disconnect().catch(() => {})
    return false
  }
}

async function fixConnection() {
  const envPath = path.join(process.cwd(), '.env')
  const envContent = fs.readFileSync(envPath, 'utf8')
  
  // Extract current password
  const match = envContent.match(/DATABASE_URL="postgresql:\/\/postgres:([^@]+)@/)
  if (!match) {
    console.error('❌ Could not parse current DATABASE_URL')
    process.exit(1)
  }
  
  const rawPassword = match[1]
  const decodedPassword = decodeURIComponent(rawPassword.replace(/%40/g, '@').replace(/%25/g, '%'))
  const projectRef = 'ptjnlzrvqyynklzdipac'
  
  console.log('\n🔧 Fixing Supabase Connection...\n')
  
  // Try different connection formats
  const formats = [
    {
      name: 'Connection Pooling (Port 6543) - Recommended',
      url: `postgresql://postgres.${projectRef}:${urlEncodePassword(decodedPassword)}@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true`,
    },
    {
      name: 'Connection Pooling with limit',
      url: `postgresql://postgres.${projectRef}:${urlEncodePassword(decodedPassword)}@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1`,
    },
    {
      name: 'Direct Connection (Port 5432)',
      url: `postgresql://postgres:${urlEncodePassword(decodedPassword)}@db.${projectRef}.supabase.co:5432/postgres`,
    },
  ]
  
  console.log('Testing connection formats...\n')
  
  for (const format of formats) {
    process.stdout.write(`Testing: ${format.name}... `)
    const works = await testConnection(format.url)
    
    if (works) {
      console.log('✅ SUCCESS!\n')
      
      // Update .env
      const newEnv = envContent.replace(
        /DATABASE_URL="[^"]+"/,
        `DATABASE_URL="${format.url}"`
      )
      fs.writeFileSync(envPath, newEnv, 'utf8')
      
      console.log('✅ Updated .env file with working connection string')
      console.log(`✅ Using: ${format.name}\n`)
      
      return format.url
    } else {
      console.log('❌ Failed')
    }
  }
  
  console.log('\n❌ All connection formats failed!')
  console.log('\n🔧 Troubleshooting:')
  console.log('   1. Check if Supabase project is active (not paused)')
  console.log('   2. Go to: https://supabase.com/dashboard/project/' + projectRef)
  console.log('   3. If paused, click "Restore" and wait 2-3 minutes')
  console.log('   4. Verify your database password is correct')
  console.log('   5. Get connection string from: Settings → Database → Connection string → URI\n')
  
  process.exit(1)
}

fixConnection().catch(console.error)

