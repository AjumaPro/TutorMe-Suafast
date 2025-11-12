/**
 * Paystack Checkout Page Configuration
 * 
 * Customize the appearance and behavior of the Paystack checkout page.
 * 
 * Available Payment Channels:
 * - 'card': Credit/debit card payments
 * - 'bank': Bank account payments
 * - 'ussd': USSD payments (mobile banking)
 * - 'qr': QR code payments
 * - 'mobile_money': Mobile money (MTN, Vodafone, AirtelTigo in Ghana)
 * - 'bank_transfer': Direct bank transfers
 * 
 * To customize:
 * 1. Update the channels array to show/hide payment methods
 * 2. Add your logo URL to NEXT_PUBLIC_PAYSTACK_LOGO_URL environment variable
 * 3. Configure split payments if tutors receive direct payouts
 * 4. Set up subaccounts in Paystack dashboard for split payments
 */

export const paystackConfig = {
  // Branding
  logo: process.env.NEXT_PUBLIC_PAYSTACK_LOGO_URL || '', 
  // URL to your logo image (recommended: 200x50px PNG, hosted on HTTPS)
  // Example: 'https://yourdomain.com/images/logo.png'
  
  title: 'Suafast - Complete Your Payment',
  description: 'Secure payment for your tutoring session',
  
  // Colors (hex codes) - Note: These are for reference, actual styling is done via Payment Pages
  primaryColor: '#EC4899', // Pink-500 (matches Suafast theme)
  secondaryColor: '#F3F4F6', // Gray-100
  
  // Payment channels to display on checkout page
  // Remove channels you don't want to support
  channels: [
    'card',           // Credit/debit card payments (Visa, Mastercard, etc.)
    'bank',           // Bank account payments
    'ussd',           // USSD payments (mobile banking codes)
    'qr',             // QR code payments
    'mobile_money',   // Mobile money (Ghana: MTN, Vodafone, AirtelTigo)
    'bank_transfer',  // Direct bank transfers
  ] as string[],
  
  // Fee bearer configuration
  // 'account': Platform pays Paystack fees (default)
  // 'subaccount': Subaccount (tutor) pays fees
  bearer: 'account',
  
  // Split payment configuration
  // Set up split payments in Paystack dashboard to automatically split revenue
  // between platform and tutors. Get the split code from Paystack dashboard.
  splitCode: process.env.PAYSTACK_SPLIT_CODE || '',
  // Example: 'SPLIT_xxxxxxxxxxxxx'
  
  // Tax information (if applicable)
  tax: 0, // Tax amount in pesewas (1 GHS = 100 pesewas)
}

/**
 * Get Paystack transaction initialization options
 */
export function getPaystackTransactionOptions(overrides: {
  email: string
  amount: number
  reference: string
  currency: string
  metadata: Record<string, any>
  callbackUrl: string
}) {
  const baseOptions: any = {
    email: overrides.email,
    amount: overrides.amount,
    reference: overrides.reference,
    currency: overrides.currency,
    metadata: overrides.metadata,
    callback_url: overrides.callbackUrl,
    
    // Channels to display
    channels: paystackConfig.channels,
    
    // Branding (if logo is provided)
    ...(paystackConfig.logo && { logo: paystackConfig.logo }),
  }
  
  // Add split code if configured
  if (paystackConfig.splitCode) {
    baseOptions.split_code = paystackConfig.splitCode
  }
  
  // Add bearer if different from default
  if (paystackConfig.bearer !== 'account') {
    baseOptions.bearer = paystackConfig.bearer
  }
  
  return baseOptions
}

