# Suafast - Tutoring Marketplace Platform

An end-to-end tutoring marketplace that connects students with verified tutors for both in-person and online lessons.

## 🚀 Features

### For Students/Parents
- 🔍 Search tutors by subject, grade level, location, and price
- 📅 Book lessons (single or recurring)
- 💳 Secure payment processing via Paystack
- 🎥 Online and in-person lesson options
- ⭐ Review and rate tutors

### For Tutors
- 👤 Create and manage detailed profiles
- 📚 Set subjects, grade levels, and hourly rates
- 📆 Manage availability calendar
- 💰 Receive payments and track earnings
- 📊 View booking history and reviews

### For Admins
- ✅ Approve/reject tutor registrations
- 📈 View platform analytics and revenue
- 🔧 Manage platform settings

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **Payments**: Paystack
- **Video**: (Ready for Twilio/Daily.co integration)

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL database (or SQLite for development)
- Paystack account (for payments)

## 🔧 Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Suafast
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your environment variables:
   - `DATABASE_URL`: PostgreSQL connection string (or SQLite for dev)
   - `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL`: Your app URL (e.g., `http://localhost:3000`)
   - `PAYSTACK_SECRET_KEY`: Your Paystack secret key
   - `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`: Your Paystack public key
   - Video service keys (optional, for Phase 2)

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
Suafast/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── admin/             # Admin dashboard
│   ├── tutor/             # Tutor pages
│   ├── search/            # Tutor search
│   └── bookings/          # Booking management
├── components/            # React components
├── lib/                   # Utility functions
├── prisma/                # Database schema
└── types/                 # TypeScript types
```

## 🔐 Default Admin Account

To create an admin account, you can either:
1. Sign up normally and manually update the database:
   ```sql
   UPDATE users SET role = 'ADMIN' WHERE email = 'your-email@example.com';
   ```
2. Or use Prisma Studio:
   ```bash
   npm run db:studio
   ```

## 🎯 Development Roadmap

### Phase 1 - MVP (Current)
- ✅ User authentication (parents, tutors, admin)
- ✅ Tutor profile creation and management
- ✅ Tutor search and discovery
- ✅ Booking and scheduling system
- ✅ Payment integration (Paystack)
- ✅ Admin dashboard for tutor approvals

### Phase 2 - Expansion
- [ ] In-person booking with location filtering & maps
- [ ] Messaging/chat between parents and tutors
- [ ] Reviews and ratings system
- [ ] Video classroom integration (Twilio/Daily.co)
- [ ] Email notifications (SendGrid)
- [ ] Availability calendar management

### Phase 3 - Growth
- [ ] Mobile app (React Native/Flutter)
- [ ] Advanced analytics for tutors
- [ ] Group lessons or workshops
- [ ] AI-based tutor matching
- [ ] Recurring booking options
- [ ] Homework upload/support module

## 💳 Payment Setup (Paystack)

1. Create a Paystack account at [paystack.com](https://paystack.com)
2. Get your API keys from the Paystack dashboard:
   - Go to **Settings** > **API Keys & Webhooks**
   - Copy your **Public Key** and **Secret Key**
3. Add them to your `.env` file:
   ```
   PAYSTACK_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...
   ```
   
   **Optional Configuration:**
   ```
   NEXT_PUBLIC_PAYSTACK_LOGO_URL=https://yourdomain.com/logo.png
   PAYSTACK_SPLIT_CODE=SPLIT_xxxxx  # For split payments to tutors
   ```
4. **Configure Checkout Page** (Optional):
   - Customize checkout appearance in `lib/paystack-config.ts`
   - Add your logo URL to `NEXT_PUBLIC_PAYSTACK_LOGO_URL` environment variable
   - Configure payment channels (card, bank, mobile money, etc.)
   - Set up split payments if tutors receive direct payouts

5. Set up webhooks (for production):
   - In Paystack dashboard, go to **Settings** > **API Keys & Webhooks**
   - Add webhook URL: `https://yourdomain.com/api/payments/webhook`
   - The webhook will automatically verify payments and update booking status

6. **Test Mode**: Use test keys for development. Test cards are available in the Paystack dashboard.

7. **Currency**: The integration uses GHS (Ghana Cedis) by default. To change to USD, NGN, or other currencies:
   - Update `currency: 'GHS'` to your desired currency in:
     - `app/api/payments/initialize/route.ts`
     - `components/PaymentForm.tsx`
   - Adjust amount conversion (pesewas for GHS, kobo for NGN, cents for USD)
   - Update currency symbol (₵ for GHS, ₦ for NGN, $ for USD) in `components/PaymentForm.tsx`

## 🎥 Video Integration (Future)

The platform is ready for video integration. You can use:
- **Twilio Video**: For robust video calling
- **Daily.co**: For easy video rooms
- **Zoom SDK**: For enterprise solutions
- **WebRTC**: For custom implementation

## 📝 Database Schema

Key models:
- `User`: Authentication and user data
- `TutorProfile`: Tutor-specific information
- `Booking`: Lesson bookings
- `Payment`: Payment transactions
- `Review`: Student reviews
- `Address`: User addresses for in-person lessons

See `prisma/schema.prisma` for the complete schema.

## 🚢 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

### Other Platforms
- **Render**: Supports PostgreSQL and Node.js
- **Railway**: Easy PostgreSQL + Node.js deployment
- **AWS/GCP**: Full control, more setup required

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For support, email support@tutorme.com or open an issue on GitHub.

---

Built with ❤️ for connecting students with great tutors.

