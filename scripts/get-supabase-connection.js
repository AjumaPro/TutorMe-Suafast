#!/usr/bin/env node

/**
 * Get Supabase Connection String from Dashboard
 * Guides user to get the correct connection string
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

async function getConnectionString() {
  console.log('\n🔧 Supabase Connection String Setup\n')
  console.log('=' .repeat(60))
  console.log('\n⚠️  IMPORTANT: You need to get the connection string from Supabase dashboard.\n')
  
  const projectRef = 'ptjnlzrvqyynklzdipac'
  const dashboardUrl = `https://supabase.com/dashboard/project/${projectRef}/settings/database`
  
  console.log('📋 Step-by-Step Instructions:\n')
  console.log('1. Open your browser and go to:')
  console.log(`   ${dashboardUrl}\n`)
  console.log('2. Scroll down to the "Connection string" section')
  console.log('3. Click on the "URI" tab')
  console.log('4. You will see a connection string like:')
  console.log('   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres')
  console.log('5. Click the "Copy" button to copy the entire connection string\n')
  console.log('⚠️  Make sure to:')
  console.log('   - Copy the ENTIRE connection string (it includes the password)')
  console.log('   - Use the connection string from the "URI" tab')
  console.log('   - Don\'t manually construct it\n')
  
  const hasConnectionString = await question('Have you copied the connection string from Supabase? (y/n): ')
  
  if (hasConnectionString.toLowerCase() !== 'y') {
    console.log('\nPlease follow the steps above and come back when you have the connection string.')
    rl.close()
    process.exit(0)
  }
  
  console.log('\n📝 Paste your connection string below:')
  console.log('   (It should start with: postgresql://postgres...)')
  
  const connectionString = await question('\nConnection string: ')
  
  if (!connectionString.trim() || !connectionString.startsWith('postgresql://')) {
    console.log('\n❌ Invalid connection string format!')
    console.log('   It should start with: postgresql://postgres...')
    rl.close()
    process.exit(1)
  }
  
  // Test the connection
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
    
    // Update .env file
    const envPath = path.join(process.cwd(), '.env')
    let envContent = fs.readFileSync(envPath, 'utf8')
    
    envContent = envContent.replace(/DATABASE_URL=.*/g, '')
    if (envContent.trim() && !envContent.endsWith('\n')) {
      envContent += '\n'
    }
    envContent += `DATABASE_URL="${connectionString.trim()}"\n`
    
    fs.writeFileSync(envPath, envContent, 'utf8')
    console.log('✅ Updated .env file with connection string\n')
    
    await prisma.$disconnect()
    
    // Generate Prisma Client
    console.log('📦 Generating Prisma Client...')
    const { execSync } = require('child_process')
    execSync('npx prisma generate', { stdio: 'inherit' })
    console.log('\n✅ Prisma Client generated\n')
    
    // Ask about pushing schema
    const pushSchema = await question('Do you want to push the database schema now? (y/n): ')
    
    if (pushSchema.toLowerCase() === 'y') {
      console.log('\n📊 Pushing database schema...')
      try {
        execSync('npx prisma db push', { stdio: 'inherit' })
        console.log('\n✅ Database schema pushed successfully!\n')
      } catch (error) {
        console.error('\n⚠️  Schema push failed. You can try again later with: npx prisma db push\n')
      }
    }
    
    console.log('=' .repeat(60))
    console.log('\n🎉 Setup complete!\n')
    console.log('✅ Connection string configured')
    console.log('✅ Prisma Client generated')
    console.log('✅ Ready to use!\n')
    console.log('📝 Next steps:')
    console.log('   - If schema wasn\'t pushed: npx prisma db push')
    console.log('   - Create admin account: npm run setup:admin')
    console.log('   - Restart your dev server\n')
    
  } catch (error) {
    console.error('\n❌ Connection failed!\n')
    console.error('Error:', error.message.split('\n')[0])
    console.log('\n🔧 Troubleshooting:')
    console.log('   1. Verify the connection string is correct')
    console.log('   2. Check if Supabase project is active (not paused)')
    console.log('   3. Go to Supabase dashboard and check project status')
    console.log('   4. Try resetting your database password\n')
    await prisma.$disconnect().catch(() => {})
    process.exit(1)
  }
  
  rl.close()
}

getConnectionString().catch((error) => {
  console.error('\n❌ Error:', error.message)
  rl.close()
  process.exit(1)
})

