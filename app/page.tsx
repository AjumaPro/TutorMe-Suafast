import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { Search, Users, Calendar, Video, Star, Shield, Clock } from 'lucide-react'

export default async function Home() {
  const session = await getServerSession(authOptions)
  
  // Redirect authenticated users to dashboard
  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar />
      
      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6">
            Find Your Perfect
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">
              {' '}Tutor
            </span>
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            Connect with verified tutors for personalized learning. Choose from
            in-person or online lessons tailored to your needs.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/auth/signup"
              className="bg-gradient-to-r from-pink-600 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-pink-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
            >
              Get Started
            </Link>
            <Link
              href="/auth/signup?role=tutor"
              className="bg-white text-pink-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 shadow-lg border-2 border-pink-600 transition-all transform hover:-translate-y-1"
            >
              Become a Tutor
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100">
            <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center mb-4">
              <Search className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-800">Easy Search</h3>
            <p className="text-gray-600">
              Find tutors by subject, grade level, location, and price
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-800">Verified Tutors</h3>
            <p className="text-gray-600">
              All tutors are verified and background-checked for your safety
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100">
            <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center mb-4">
              <Calendar className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-800">Flexible Scheduling</h3>
            <p className="text-gray-600">
              Book lessons that fit your schedule, one-time or recurring
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
              <Video className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-800">Online & In-Person</h3>
            <p className="text-gray-600">
              Choose between virtual lessons or meet in person
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-24 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl p-12 text-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-pink-100">Verified Tutors</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">10,000+</div>
              <div className="text-pink-100">Lessons Completed</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">4.9</div>
              <div className="text-pink-100 flex items-center justify-center gap-1">
                <Star className="h-5 w-5 fill-current" />
                Average Rating
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

