import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import nodemailer from 'nodemailer'

// Generate TOTP secret and QR code
export async function generateTOTPSecret(userEmail: string, serviceName: string = 'TutorMe') {
  const result = speakeasy.generateSecret({
    name: `${serviceName} (${userEmail})`,
    issuer: serviceName,
    length: 32,
  })

  // Generate QR code data URL
  const otpauthUrl = result.secret.otpauth_url || result.secret.qr_code_ascii || ''
  const qrCodeUrl = await QRCode.toDataURL(otpauthUrl)

  return {
    secret: result.secret.base32,
    qrCodeUrl,
    manualEntryKey: result.secret.base32,
  }
}

// Verify TOTP token
export function verifyTOTPToken(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2, // Allow 2 time steps (60 seconds) before/after current time
  })
}

// Generate email OTP code
export function generateEmailOTP(): string {
  // Generate 6-digit code
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Generate SMS OTP code (same format as email)
export function generateSMSOTP(): string {
  // Generate 6-digit code
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Hash backup codes
export async function hashBackupCode(code: string): Promise<string> {
  return bcrypt.hash(code, 10)
}

// Verify backup code
export async function verifyBackupCode(code: string, hashedCode: string): Promise<boolean> {
  return bcrypt.compare(code, hashedCode)
}

// Generate backup codes
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = crypto.randomBytes(4).toString('hex').toUpperCase()
    codes.push(code)
  }
  return codes
}

// Hash backup codes array
export async function hashBackupCodesArray(codes: string[]): Promise<string[]> {
  return Promise.all(codes.map(code => hashBackupCode(code)))
}

// Create email transporter (reusable)
function createEmailTransporter() {
  // Check if SMTP is configured
  const smtpHost = process.env.SMTP_HOST
  const smtpPort = process.env.SMTP_PORT
  const smtpUser = process.env.SMTP_USER
  const smtpPassword = process.env.SMTP_PASS || process.env.SMTP_PASSWORD
  const smtpFrom = process.env.SMTP_FROM || smtpUser || 'noreply@tutorme.com'

  // If SMTP is not configured, return null (will use console logging)
  if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword) {
    return null
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort, 10),
    secure: parseInt(smtpPort, 10) === 465, // true for 465, false for other ports
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
    // For Gmail and other services that require TLS
    tls: {
      rejectUnauthorized: false, // Set to true in production with valid certificates
    },
  })
}

// Send email OTP
export async function sendEmailOTP(email: string, code: string): Promise<void> {
  const transporter = createEmailTransporter()

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Verification Code</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">TutorMe</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
          <h2 style="color: #111827; margin-top: 0;">Two-Factor Authentication Code</h2>
          <p style="color: #6b7280; font-size: 16px;">
            Your verification code for TutorMe is:
          </p>
          <div style="background: white; border: 2px dashed #ec4899; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <div style="font-size: 32px; font-weight: bold; color: #ec4899; letter-spacing: 8px; font-family: 'Courier New', monospace;">
              ${code}
            </div>
          </div>
          <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">
            This code will expire in <strong>10 minutes</strong>.
          </p>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            If you didn't request this code, please ignore this email or contact support if you have concerns.
          </p>
        </div>
      </body>
    </html>
  `

  const emailText = `
TutorMe - Two-Factor Authentication Code

Your verification code is: ${code}

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email or contact support if you have concerns.
  `.trim()

  // If email is configured, send it
  if (transporter) {
    try {
      const smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@tutorme.com'
      
      await transporter.sendMail({
        from: `"TutorMe" <${smtpFrom}>`,
        to: email,
        subject: 'Your Two-Factor Authentication Code',
        text: emailText,
        html: emailHtml,
      })

      console.log(`✅ Email OTP sent successfully to ${email}`)
    } catch (error) {
      console.error('❌ Failed to send email OTP:', error)
      // Fall back to console logging if email fails
      console.log(`📧 Email OTP for ${email}: ${code}`)
      console.log(`Email OTP expires in 10 minutes`)
      // Don't throw - allow the process to continue even if email fails
    }
  } else {
    // SMTP not configured - log to console (development mode)
    console.log(`📧 Email OTP for ${email}: ${code}`)
    console.log(`Email OTP expires in 10 minutes`)
    console.log(`\n⚠️  SMTP not configured. To enable email sending, set these environment variables:`)
    console.log(`   SMTP_HOST=your-smtp-host`)
    console.log(`   SMTP_PORT=587 (or 465 for SSL)`)
    console.log(`   SMTP_USER=your-email@example.com`)
    console.log(`   SMTP_PASSWORD=your-email-password`)
    console.log(`   SMTP_FROM=noreply@tutorme.com (optional)\n`)
  }
}

// Send SMS OTP using the SMS utility
export async function sendSMSOTP(phoneNumber: string, code: string): Promise<void> {
  const { sendSMS } = await import('./sms')
  
  const message = `Your TutorMe verification code is: ${code}. This code expires in 10 minutes.`
  
  const result = await sendSMS(phoneNumber, message, code)
  
  if (result.success) {
    console.log(`✅ SMS OTP sent successfully via ${result.provider}`)
  } else {
    console.error(`❌ Failed to send SMS OTP: ${result.error}`)
  }
}

