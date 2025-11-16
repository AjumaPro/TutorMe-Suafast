/**
 * Test Email Configuration
 * This script checks if email configuration is properly set up
 */

require('dotenv').config()

console.log('📧 Email Configuration Test\n')
console.log('=' .repeat(50))

// Check Resend configuration
console.log('\n1. Resend Configuration:')
const resendKey = process.env.RESEND_API_KEY
const resendFrom = process.env.RESEND_FROM_EMAIL
console.log(`   RESEND_API_KEY: ${resendKey ? '✅ Set (' + resendKey.substring(0, 10) + '...)' : '❌ Not set'}`)
console.log(`   RESEND_FROM_EMAIL: ${resendFrom ? '✅ Set (' + resendFrom + ')' : '⚠️  Not set (will use default)'}`)

// Check SMTP configuration
console.log('\n2. SMTP Configuration:')
const smtpHost = process.env.SMTP_HOST
const smtpPort = process.env.SMTP_PORT
const smtpUser = process.env.SMTP_USER
const smtpPass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD
const smtpFrom = process.env.SMTP_FROM
const smtpSecure = process.env.SMTP_SECURE

console.log(`   SMTP_HOST: ${smtpHost ? '✅ Set (' + smtpHost + ')' : '❌ Not set'}`)
console.log(`   SMTP_PORT: ${smtpPort ? '✅ Set (' + smtpPort + ')' : '⚠️  Not set (will use 587)'}`)
console.log(`   SMTP_USER: ${smtpUser ? '✅ Set (' + smtpUser + ')' : '❌ Not set'}`)
console.log(`   SMTP_PASSWORD: ${smtpPass ? '✅ Set (***hidden***)' : '❌ Not set'}`)
console.log(`   SMTP_FROM: ${smtpFrom ? '✅ Set (' + smtpFrom + ')' : '⚠️  Not set (will use SMTP_USER or default)'}`)
console.log(`   SMTP_SECURE: ${smtpSecure ? '✅ Set (' + smtpSecure + ')' : '⚠️  Not set (will use false)'}`)

// Determine which provider will be used
console.log('\n3. Active Email Provider:')
if (resendKey) {
  console.log('   ✅ Resend will be used (primary)')
  console.log('   📝 Make sure "resend" package is installed: npm install resend')
} else if (smtpHost && smtpUser && smtpPass) {
  console.log('   ✅ SMTP will be used (fallback)')
  console.log('   📝 Configuration looks complete')
} else {
  console.log('   ❌ No email provider configured')
  console.log('   ⚠️  Emails will be logged to console only')
}

// Check for conflicts
console.log('\n4. Configuration Check:')
if (resendKey && smtpHost) {
  console.log('   ⚠️  Both Resend and SMTP are configured')
  console.log('   ℹ️  Resend will be used first (priority)')
}

if (smtpHost && !smtpUser) {
  console.log('   ❌ SMTP_HOST set but SMTP_USER missing')
}

if (smtpHost && !smtpPass) {
  console.log('   ❌ SMTP_HOST set but SMTP_PASSWORD missing')
}

if (smtpUser && !smtpHost) {
  console.log('   ⚠️  SMTP_USER set but SMTP_HOST missing')
}

// Check package availability
console.log('\n5. Package Check:')
try {
  require('nodemailer')
  console.log('   ✅ nodemailer package installed')
} catch (e) {
  console.log('   ❌ nodemailer package NOT installed')
  console.log('   📝 Run: npm install nodemailer')
}

try {
  require('resend')
  console.log('   ✅ resend package installed')
} catch (e) {
  if (resendKey) {
    console.log('   ❌ resend package NOT installed (but RESEND_API_KEY is set)')
    console.log('   📝 Run: npm install resend')
  } else {
    console.log('   ⚠️  resend package not installed (not needed if using SMTP)')
  }
}

// Summary
console.log('\n' + '='.repeat(50))
console.log('\n📋 Summary:')

const canSendEmails = (resendKey && require('resend')) || (smtpHost && smtpUser && smtpPass && require('nodemailer'))

if (canSendEmails) {
  console.log('   ✅ Email sending is CONFIGURED and READY')
  console.log('   🎉 Emails will be sent to users')
} else {
  console.log('   ❌ Email sending is NOT configured')
  console.log('   ⚠️  Emails will only be logged to console')
  console.log('\n   To fix:')
  if (!resendKey && !smtpHost) {
    console.log('   1. Choose an email provider (Resend or SMTP)')
    console.log('   2. Add credentials to .env file')
  }
  if (resendKey && !require('resend')) {
    console.log('   3. Install resend: npm install resend')
  }
  if (smtpHost && !require('nodemailer')) {
    console.log('   3. Install nodemailer: npm install nodemailer')
  }
}

console.log('\n')

