/**
 * Email utility for sending notifications
 * Supports multiple email providers (nodemailer, Resend, SendGrid, etc.)
 */

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
  from?: string
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Try Resend first (recommended for production)
    if (process.env.RESEND_API_KEY) {
      return await sendEmailViaResend(options)
    }

    // Fallback to nodemailer (SMTP)
    if (process.env.SMTP_HOST && process.env.SMTP_USER && (process.env.SMTP_PASS || process.env.SMTP_PASSWORD)) {
      return await sendEmailViaNodemailer(options)
    }

    // Fallback to console logging in development
    console.log('📧 Email would be sent:', {
      to: options.to,
      subject: options.subject,
      html: options.html,
    })
    return true
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}

async function sendEmailViaResend(options: EmailOptions): Promise<boolean> {
  try {
    // Dynamically require resend to avoid build errors if not installed
    let resend: any
    try {
      resend = require('resend')
    } catch (e) {
      console.warn('Resend package not installed, skipping Resend email provider')
      return false
    }
    
    if (!resend || !resend.Resend) {
      return false
    }
    
    const resendClient = new resend.Resend(process.env.RESEND_API_KEY)

    const from = options.from || process.env.RESEND_FROM_EMAIL || 'TutorMe <noreply@tutorme.com>'

    const { data, error } = await resendClient.emails.send({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
    })

    if (error) {
      console.error('Resend error:', error)
      return false
    }

    console.log('✅ Email sent via Resend:', data?.id)
    return true
  } catch (error) {
    console.error('Resend send error:', error)
    return false
  }
}

async function sendEmailViaNodemailer(options: EmailOptions): Promise<boolean> {
  try {
    const nodemailer = require('nodemailer')

    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: smtpPort,
      secure: process.env.SMTP_SECURE === 'true' || smtpPort === 465, // Auto-detect SSL for port 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false, // Allow self-signed certificates
      },
    })

    const from = options.from || process.env.SMTP_FROM || 'TutorMe <noreply@tutorme.com>'

    await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
    })

    console.log('✅ Email sent via SMTP')
    return true
  } catch (error) {
    console.error('SMTP send error:', error)
    return false
  }
}

/**
 * Send booking notification email to tutor
 */
export async function sendBookingNotificationEmail(
  tutorEmail: string,
  tutorName: string,
  studentName: string,
  booking: {
    id: string
    subject: string
    scheduledAt: string
    duration: number
    lessonType: string
    price: number
    currency: string
  }
): Promise<boolean> {
  const scheduledDate = new Date(booking.scheduledAt)
  const formattedDate = scheduledDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Booking Request</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">🎓 New Booking Request</h1>
      </div>
      
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
        <p style="font-size: 16px;">Hello <strong>${tutorName}</strong>,</p>
        
        <p style="font-size: 16px;">You have received a new booking request from <strong>${studentName}</strong>!</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ec4899;">
          <h2 style="margin-top: 0; color: #ec4899;">Lesson Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 120px;">Subject:</td>
              <td style="padding: 8px 0;">${booking.subject}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Date & Time:</td>
              <td style="padding: 8px 0;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Duration:</td>
              <td style="padding: 8px 0;">${booking.duration} minutes</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Type:</td>
              <td style="padding: 8px 0;">${booking.lessonType === 'ONLINE' ? 'Online' : 'In-Person'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Price:</td>
              <td style="padding: 8px 0; font-size: 18px; color: #10b981; font-weight: bold;">₵${booking.price.toFixed(2)}</td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard" 
             style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
            View Booking in Dashboard
          </a>
        </div>
        
        <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
          You can manage this booking and all your classes from your tutor dashboard.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">
          This is an automated notification from TutorMe. Please do not reply to this email.
        </p>
      </div>
    </body>
    </html>
  `

  return await sendEmail({
    to: tutorEmail,
    subject: `New Booking Request: ${booking.subject} - ${formattedDate}`,
    html,
  })
}

/**
 * Send booking confirmation email to student
 */
export async function sendStudentBookingConfirmationEmail(
  studentEmail: string,
  studentName: string,
  tutorName: string,
  booking: {
    id: string
    subject: string
    scheduledAt: string
    duration: number
    lessonType: string
    price: number
    currency: string
  }
): Promise<boolean> {
  const scheduledDate = new Date(booking.scheduledAt)
  const formattedDate = scheduledDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Confirmation</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">✅ Booking Confirmed</h1>
      </div>
      
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
        <p style="font-size: 16px;">Hello <strong>${studentName}</strong>,</p>
        
        <p style="font-size: 16px;">Your booking has been confirmed! We're excited to help you learn with <strong>${tutorName}</strong>.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
          <h2 style="margin-top: 0; color: #10b981;">Lesson Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 120px;">Subject:</td>
              <td style="padding: 8px 0;">${booking.subject}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Tutor:</td>
              <td style="padding: 8px 0;">${tutorName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Date & Time:</td>
              <td style="padding: 8px 0;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Duration:</td>
              <td style="padding: 8px 0;">${booking.duration} minutes</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Type:</td>
              <td style="padding: 8px 0;">${booking.lessonType === 'ONLINE' ? 'Online' : 'In-Person'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Price:</td>
              <td style="padding: 8px 0; font-size: 18px; color: #10b981; font-weight: bold;">₵${booking.price.toFixed(2)}</td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/bookings/${booking.id}" 
             style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
            View Booking Details
          </a>
        </div>
        
        <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
          We'll send you a reminder before your lesson. If you have any questions, please contact your tutor or our support team.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">
          This is an automated notification from TutorMe. Please do not reply to this email.
        </p>
      </div>
    </body>
    </html>
  `

  return await sendEmail({
    to: studentEmail,
    subject: `Booking Confirmed: ${booking.subject} with ${tutorName} - ${formattedDate}`,
    html,
  })
}

/**
 * Send booking confirmed email to tutor (when student confirms)
 */
export async function sendTutorBookingConfirmedEmail(
  tutorEmail: string,
  tutorName: string,
  studentName: string,
  booking: {
    id: string
    subject: string
    scheduledAt: string
    duration: number
    lessonType: string
    price: number
    currency: string
    paymentStatus?: string
  }
): Promise<boolean> {
  const scheduledDate = new Date(booking.scheduledAt)
  const formattedDate = scheduledDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Confirmed</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">✅ Booking Confirmed</h1>
      </div>
      
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
        <p style="font-size: 16px;">Hello <strong>${tutorName}</strong>,</p>
        
        <p style="font-size: 16px;"><strong>${studentName}</strong> has confirmed the booking${booking.paymentStatus === 'PAID' ? ' and payment has been received' : ''}!</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
          <h2 style="margin-top: 0; color: #10b981;">Lesson Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 120px;">Subject:</td>
              <td style="padding: 8px 0;">${booking.subject}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Student:</td>
              <td style="padding: 8px 0;">${studentName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Date & Time:</td>
              <td style="padding: 8px 0;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Duration:</td>
              <td style="padding: 8px 0;">${booking.duration} minutes</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Type:</td>
              <td style="padding: 8px 0;">${booking.lessonType === 'ONLINE' ? 'Online' : 'In-Person'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Price:</td>
              <td style="padding: 8px 0; font-size: 18px; color: #10b981; font-weight: bold;">₵${booking.price.toFixed(2)}</td>
            </tr>
            ${booking.paymentStatus === 'PAID' ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Payment:</td>
              <td style="padding: 8px 0; color: #10b981; font-weight: bold;">✅ Paid</td>
            </tr>
            ` : ''}
          </table>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/bookings/${booking.id}" 
             style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
            View Booking Details
          </a>
        </div>
        
        <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
          Please prepare for the lesson and ensure you're available at the scheduled time. If you need to make any changes, please contact the student or our support team.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">
          This is an automated notification from TutorMe. Please do not reply to this email.
        </p>
      </div>
    </body>
    </html>
  `

  return await sendEmail({
    to: tutorEmail,
    subject: `Booking Confirmed: ${booking.subject} with ${studentName} - ${formattedDate}`,
    html,
  })
}

/**
 * Send payment confirmation email to student
 */
export async function sendPaymentConfirmationEmail(
  studentEmail: string,
  studentName: string,
  booking: {
    id: string
    subject: string
    scheduledAt: string
    tutorName: string
    amount: number
    currency: string
  }
): Promise<boolean> {
  const scheduledDate = new Date(booking.scheduledAt)
  const formattedDate = scheduledDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Confirmed</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">💳 Payment Confirmed</h1>
      </div>
      
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
        <p style="font-size: 16px;">Hello <strong>${studentName}</strong>,</p>
        
        <p style="font-size: 16px;">Great news! Your payment has been confirmed and your booking is now active.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
          <h2 style="margin-top: 0; color: #10b981;">Payment Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 120px;">Amount Paid:</td>
              <td style="padding: 8px 0; font-size: 20px; color: #10b981; font-weight: bold;">₵${booking.amount.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Subject:</td>
              <td style="padding: 8px 0;">${booking.subject}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Tutor:</td>
              <td style="padding: 8px 0;">${booking.tutorName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Scheduled:</td>
              <td style="padding: 8px 0;">${formattedDate}</td>
            </tr>
          </table>
        </div>
        
        <div style="background: #d1fae5; border: 1px solid #10b981; border-radius: 6px; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #065f46; font-size: 14px;">
            <strong>✅ Your booking is confirmed!</strong> You're all set for your lesson. We'll send you a reminder before the scheduled time.
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/bookings/${booking.id}" 
             style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
            View Booking
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">
          This is an automated notification from TutorMe. Please do not reply to this email.
        </p>
      </div>
    </body>
    </html>
  `

  return await sendEmail({
    to: studentEmail,
    subject: `Payment Confirmed: ₵${booking.amount.toFixed(2)} for ${booking.subject}`,
    html,
  })
}

/**
 * Send password reset email to user
 */
export async function sendPasswordResetEmail(
  userEmail: string,
  userName: string,
  resetToken: string
): Promise<boolean> {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const resetLink = `${baseUrl}/auth/reset-password?token=${resetToken}`
  
  // Token expires in 1 hour
  const expiryTime = new Date(Date.now() + 3600000).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset Request</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">🔐 Password Reset Request</h1>
      </div>
      
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
        <p style="font-size: 16px;">Hello <strong>${userName}</strong>,</p>
        
        <p style="font-size: 16px;">
          We received a request to reset your password for your TutorMe account. 
          If you didn't make this request, you can safely ignore this email.
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ec4899;">
          <p style="margin-top: 0; color: #6b7280; font-size: 14px; margin-bottom: 15px;">
            Click the button below to reset your password:
          </p>
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="${resetLink}" 
               style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; padding: 14px 35px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 12px; margin-bottom: 0; word-break: break-all;">
            Or copy and paste this link into your browser:<br>
            <a href="${resetLink}" style="color: #ec4899; text-decoration: underline;">${resetLink}</a>
          </p>
        </div>
        
        <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 6px; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>⏰ Important:</strong> This password reset link will expire in <strong>1 hour</strong> (${expiryTime}).
          </p>
        </div>
        
        <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
          For security reasons, if you didn't request this password reset, please ignore this email. 
          Your password will remain unchanged.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-bottom: 0;">
          This is an automated email from TutorMe. Please do not reply to this email.<br>
          If you have any questions, please contact our support team.
        </p>
      </div>
    </body>
    </html>
  `

  const text = `
Password Reset Request - TutorMe

Hello ${userName},

We received a request to reset your password for your TutorMe account.

Click the link below to reset your password:
${resetLink}

This link will expire in 1 hour (${expiryTime}).

If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.

This is an automated email from TutorMe. Please do not reply to this email.
  `.trim()

  return await sendEmail({
    to: userEmail,
    subject: 'Reset Your TutorMe Password',
    html,
    text,
  })
}

