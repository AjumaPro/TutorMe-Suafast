/**
 * Test Email Sending
 * This script tests if emails can actually be sent using the configured SMTP
 */

require('dotenv').config()

async function testEmailSending() {
  console.log('📧 Testing Email Sending...\n')
  console.log('='.repeat(50))

  // Check configuration
  const smtpHost = process.env.SMTP_HOST
  const smtpPort = process.env.SMTP_PORT
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.log('❌ SMTP not configured')
    return
  }

  console.log('✅ SMTP Configuration Found:')
  console.log(`   Host: ${smtpHost}`)
  console.log(`   Port: ${smtpPort}`)
  console.log(`   User: ${smtpUser}\n`)

  try {
    const nodemailer = require('nodemailer')
    
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort || '587', 10),
      secure: parseInt(smtpPort || '587', 10) === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    })

    // Test connection
    console.log('🔌 Testing SMTP connection...')
    await transporter.verify()
    console.log('✅ SMTP connection successful!\n')

    // Send test email
    const testEmail = process.env.TEST_EMAIL || smtpUser
    console.log(`📤 Sending test email to: ${testEmail}`)
    
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || `TutorMe <${smtpUser}>`,
      to: testEmail,
      subject: 'TutorMe - Email Configuration Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ec4899;">✅ Email Configuration Successful!</h2>
          <p>This is a test email from TutorMe to verify that email sending is working correctly.</p>
          <p><strong>Configuration Details:</strong></p>
          <ul>
            <li>SMTP Host: ${smtpHost}</li>
            <li>SMTP Port: ${smtpPort}</li>
            <li>SMTP User: ${smtpUser}</li>
          </ul>
          <p style="color: #10b981; font-weight: bold;">🎉 Your email system is ready to send emails!</p>
        </div>
      `,
      text: 'Email Configuration Test - Your email system is working correctly!',
    })

    console.log('✅ Test email sent successfully!')
    console.log(`   Message ID: ${info.messageId}`)
    console.log(`\n📬 Check your inbox at: ${testEmail}`)
    console.log('   (Check spam folder if not in inbox)')

  } catch (error) {
    console.error('❌ Error sending test email:')
    console.error(`   ${error.message}`)
    
    if (error.code === 'EAUTH') {
      console.error('\n💡 Authentication failed. Check:')
      console.error('   - SMTP_USER is correct')
      console.error('   - SMTP_PASS/SMTP_PASSWORD is correct')
    } else if (error.code === 'ECONNECTION') {
      console.error('\n💡 Connection failed. Check:')
      console.error('   - SMTP_HOST is correct')
      console.error('   - SMTP_PORT is correct')
      console.error('   - Firewall/network allows connection')
    } else {
      console.error('\n💡 Check your SMTP configuration in .env')
    }
  }

  console.log('\n' + '='.repeat(50))
}

testEmailSending().catch(console.error)

