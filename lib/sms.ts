/**
 * SMS Sending Utility
 * Handles SMS sending with multiple provider support
 */

export interface SMSResult {
  success: boolean
  provider: string
  messageId?: string
  error?: string
}

/**
 * Send SMS message using configured provider
 */
export async function sendSMS(
  phoneNumber: string,
  message: string,
  code?: string
): Promise<SMSResult> {
  // Format phone number (ensure it starts with +)
  const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`

  // Get SMS provider configuration
  const smsProvider = process.env.SMS_PROVIDER || 'console'

  // Development/Console mode
  if (smsProvider === 'console' || process.env.NODE_ENV === 'development') {
    console.log(`\n📱 SMS Request:`)
    console.log(`   To: ${formattedPhone}`)
    console.log(`   Message: ${message}`)
    if (code) {
      console.log(`   Code: ${code}`)
    }
    console.log(`\n✅ SMS logged (console mode)\n`)

    return {
      success: true,
      provider: 'console',
    }
  }

  try {
    // Custom HTTP API provider
    if (smsProvider === 'api') {
      const apiUrl = process.env.SMS_API_URL
      const apiKey = process.env.SMS_API_KEY

      if (!apiUrl || !apiKey) {
        throw new Error('SMS_API_URL and SMS_API_KEY must be set for API provider')
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          ...(process.env.SMS_API_HEADERS
            ? JSON.parse(process.env.SMS_API_HEADERS)
            : {}),
        },
        body: JSON.stringify({
          to: formattedPhone,
          message: message,
          code: code,
          ...(process.env.SMS_API_EXTRA_DATA
            ? JSON.parse(process.env.SMS_API_EXTRA_DATA)
            : {}),
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`SMS API returned ${response.status}: ${errorText}`)
      }

      const result = await response.json().catch(() => ({}))

      return {
        success: true,
        provider: 'api',
        messageId: result.messageId || result.id,
      }
    }

    // AWS SNS provider
    if (smsProvider === 'aws') {
      try {
        // Use dynamic require to avoid build-time analysis
        // @ts-ignore - Optional dependency, may not be installed
        const AWS = require('aws-sdk')
        const sns = new AWS.SNS({
          region: process.env.AWS_REGION || 'us-east-1',
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        })

        const result = await sns
          .publish({
            PhoneNumber: formattedPhone,
            Message: message,
          })
          .promise()

        return {
          success: true,
          provider: 'aws',
          messageId: result.MessageId,
        }
      } catch (error: any) {
        // If package not installed, fallback to console
        if (error.code === 'MODULE_NOT_FOUND') {
          console.warn('AWS SDK not installed. Using console fallback.')
          console.log(`📱 SMS for ${formattedPhone}: ${message}`)
          return {
            success: true,
            provider: 'console',
            error: 'AWS SDK not installed',
          }
        }
        throw new Error(`AWS SMS failed: ${error.message}`)
      }
    }

    // Vonage provider
    if (smsProvider === 'vonage') {
      try {
        // Use dynamic require to avoid build-time analysis
        // @ts-ignore - Optional dependency, may not be installed
        const Vonage = require('@vonage/server-sdk')
        const vonage = new Vonage({
          apiKey: process.env.VONAGE_API_KEY,
          apiSecret: process.env.VONAGE_API_SECRET,
        })

        const result = await vonage.sms.send({
          to: formattedPhone,
          from: process.env.VONAGE_FROM_NUMBER || 'TutorMe',
          text: message,
        })

        return {
          success: true,
          provider: 'vonage',
          messageId: result.messages[0]?.messageId,
        }
      } catch (error: any) {
        // If package not installed, fallback to console
        if (error.code === 'MODULE_NOT_FOUND') {
          console.warn('Vonage SDK not installed. Using console fallback.')
          console.log(`📱 SMS for ${formattedPhone}: ${message}`)
          return {
            success: true,
            provider: 'console',
            error: 'Vonage SDK not installed',
          }
        }
        throw new Error(`Vonage SMS failed: ${error.message}`)
      }
    }

    // Unknown provider - fallback to console
    console.log(`📱 SMS for ${formattedPhone}: ${message}`)
    console.log(`⚠️  Unknown SMS provider: ${smsProvider}. Using console fallback.`)

    return {
      success: true,
      provider: 'console',
      error: `Unknown provider: ${smsProvider}`,
    }
  } catch (error: any) {
    console.error('❌ Failed to send SMS:', error.message)
    // Fall back to console logging
    console.log(`📱 SMS for ${formattedPhone}: ${message}`)
    if (code) {
      console.log(`   Code: ${code}`)
    }

    return {
      success: false,
      provider: smsProvider,
      error: error.message,
    }
  }
}

