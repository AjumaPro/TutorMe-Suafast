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
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
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

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
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

