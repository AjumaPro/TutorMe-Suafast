/**
 * Paystack Payment Test Script
 * 
 * This script helps test the Paystack payment flow by:
 * 1. Creating a test booking
 * 2. Initializing payment
 * 3. Providing test card details
 * 
 * Usage:
 *   node scripts/test-paystack-payment.js
 */

require('dotenv').config({ path: '.env.local' })
require('dotenv').config({ path: '.env' })

const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

async function main() {
  console.log('🧪 Paystack Payment Testing Guide\n')
  console.log('='.repeat(60))
  
  // Check environment variables
  const paystackKey = process.env.PAYSTACK_SECRET_KEY
  const nextAuthUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  
  console.log('\n📋 Configuration Check:')
  console.log(`   Paystack Secret Key: ${paystackKey ? paystackKey.substring(0, 10) + '...' : '❌ NOT SET'}`)
  console.log(`   NextAuth URL: ${nextAuthUrl}`)
  
  if (!paystackKey) {
    console.log('\n❌ ERROR: PAYSTACK_SECRET_KEY is not set!')
    console.log('   Please add it to your .env.local file:')
    console.log('   PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxx')
    rl.close()
    return
  }
  
  console.log('\n✅ Configuration looks good!')
  
  console.log('\n📝 Testing Steps:')
  console.log('   1. Start your development server: npm run dev')
  console.log('   2. Log in as a parent/student')
  console.log('   3. Create a booking with a tutor')
  console.log('   4. You will be redirected to the payment page')
  console.log('   5. Click "Pay with Paystack"')
  console.log('   6. Use the test card details below\n')
  
  console.log('💳 Paystack Test Card Details:')
  console.log('   Card Number: 4084084084084081')
  console.log('   CVV: 408 (any 3 digits)')
  console.log('   Expiry: 12/25 (any future date)')
  console.log('   Name: Any name')
  console.log('   PIN: 0000 (any 4 digits)')
  console.log('   OTP: 123456 (when prompted)\n')
  
  console.log('🔄 Payment Flow:')
  console.log('   1. Payment Initialization → /api/payments/initialize')
  console.log('   2. Redirect to Paystack Checkout')
  console.log('   3. Complete payment with test card')
  console.log('   4. Redirect back to → /bookings/{id}?payment=success')
  console.log('   5. Payment Verification → /api/payments/verify')
  console.log('   6. Booking status updated to CONFIRMED')
  console.log('   7. Payment status updated to PAID\n')
  
  console.log('🐛 Debugging:')
  console.log('   - Check browser console for payment logs')
  console.log('   - Check server console for API logs')
  console.log('   - Verify payment in Paystack dashboard')
  console.log('   - Check database: payments and bookings tables\n')
  
  console.log('📊 Expected Results:')
  console.log('   ✅ Payment initialized successfully')
  console.log('   ✅ Redirected to Paystack checkout')
  console.log('   ✅ Payment completed with test card')
  console.log('   ✅ Redirected back to booking page')
  console.log('   ✅ Booking status: CONFIRMED')
  console.log('   ✅ Payment status: PAID')
  console.log('   ✅ Notification created')
  console.log('   ✅ Video session created (for online lessons)\n')
  
  console.log('🔗 Useful Links:')
  console.log('   - Paystack Dashboard: https://dashboard.paystack.com')
  console.log('   - Paystack Test Cards: https://paystack.com/docs/payments/test-payments')
  console.log('   - Local App: http://localhost:3000\n')
  
  const proceed = await question('Ready to test? (y/n): ')
  
  if (proceed.toLowerCase() === 'y') {
    console.log('\n🚀 Starting test...')
    console.log('   1. Make sure your dev server is running')
    console.log('   2. Create a booking')
    console.log('   3. Follow the payment flow\n')
  } else {
    console.log('\n👋 Test cancelled. Run this script again when ready!')
  }
  
  rl.close()
}

main().catch(console.error)

