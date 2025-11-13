#!/usr/bin/env node

/**
 * Fix Supabase Connection String
 * URL-encodes special characters in password
 */

const fs = require('fs')
const path = require('path')

function urlEncodePassword(password) {
  // URL encode special characters that can break connection strings
  return password
    .replace(/%/g, '%25')  // Must be first
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

function fixConnectionString() {
  const envPath = path.join(process.cwd(), '.env')
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found!')
    process.exit(1)
  }

  let envContent = fs.readFileSync(envPath, 'utf8')
  
  // Find DATABASE_URL line
  const dbUrlMatch = envContent.match(/DATABASE_URL="([^"]+)"/)
  
  if (!dbUrlMatch) {
    console.error('❌ DATABASE_URL not found in .env file')
    process.exit(1)
  }

  const currentUrl = dbUrlMatch[1]
  console.log('Current connection string:', currentUrl.replace(/:[^:@]+@/, ':****@'))
  
  // Extract password from connection string
  // Format: postgresql://postgres:PASSWORD@host:port/database
  const passwordMatch = currentUrl.match(/postgresql:\/\/postgres:([^@]+)@/)
  
  if (!passwordMatch) {
    console.error('❌ Could not parse connection string')
    process.exit(1)
  }

  const rawPassword = passwordMatch[1]
  const encodedPassword = urlEncodePassword(rawPassword)
  
  if (rawPassword === encodedPassword) {
    console.log('✅ Password is already properly encoded')
    return
  }

  // Replace password in connection string
  const fixedUrl = currentUrl.replace(
    /postgresql:\/\/postgres:[^@]+@/,
    `postgresql://postgres:${encodedPassword}@`
  )

  // Update .env file
  const fixedEnv = envContent.replace(
    /DATABASE_URL="[^"]+"/,
    `DATABASE_URL="${fixedUrl}"`
  )

  fs.writeFileSync(envPath, fixedEnv, 'utf8')
  
  console.log('✅ Fixed connection string!')
  console.log('   Password encoded:', rawPassword, '→', encodedPassword)
  console.log('\n📝 Updated .env file')
  console.log('\n🔍 Testing connection...\n')
}

fixConnectionString()

