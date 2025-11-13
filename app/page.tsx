import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { 
  Search, 
  Users, 
  Calendar, 
  Video, 
  Star, 
  Shield, 
  Clock, 
  CheckCircle, 
  ArrowRight,
  TrendingUp,
  Award,
  MessageSquare,
  BookOpen,
  Zap,
  Heart,
  PlayCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase-db'

export default async function Home() {
  const session = await getServerSession(authOptions)
  
  // Redirect authenticated users to dashboard
  if (session) {
    redirect('/dashboard')
  }

  // Fetch real statistics with error handling
  let stats = {
    tutors: 500,
    lessons: 10000,
    rating: '4.9',
  }
  let featuredTutors: any[] = []

  try {
    const [
      totalTutorsResult,
      completedBookingsResult,
      averageRatingResult,
      tutorsResult
    ] = await Promise.all([
      supabase
        .from('tutor_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('isApproved', true),
      supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'COMPLETED'),
      supabase
        .from('tutor_profiles')
        .select('*')
        .eq('isApproved', true),
      supabase
        .from('tutor_profiles')
        .select('*')
        .eq('isApproved', true)
        .order('rating', { ascending: false })
        .limit(3),
    ])

    const totalTutors = totalTutorsResult.count || 500
    const completedBookings = completedBookingsResult.count || 10000
    
    // Calculate average rating
    const profiles = averageRatingResult.data || []
    const rated = profiles.filter((p: any) => p.rating > 0)
    const avg = rated.length > 0 
      ? rated.reduce((sum: number, p: any) => sum + (p.rating || 0), 0) / rated.length
      : 4.9
    const averageRating = { _avg: { rating: avg } }

    // Fetch user and reviews for featured tutors
    const featuredTutorsData = tutorsResult.data || []
    for (const profile of featuredTutorsData) {
      if (profile.userId) {
        const { data: user } = await supabase
          .from('users')
          .select('*')
          .eq('id', profile.userId)
          .single()
        profile.user = user ? {
          name: user.name,
          image: user.image,
        } : null
      }
      const { data: reviews } = await supabase
        .from('reviews')
        .select('*')
        .eq('tutorId', profile.id)
      profile.reviews = (reviews || []).map((r: any) => ({ rating: r.rating }))
    }
    const tutors = featuredTutorsData

    const avgRating = averageRating._avg?.rating || 4.9
    stats = {
      tutors: totalTutors || 500,
      lessons: completedBookings || 10000,
      rating: avgRating.toFixed(1),
    }
    featuredTutors = tutors || []
  } catch (error) {
    console.error('Error fetching homepage statistics:', error)
    // Use default values if database query fails
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-pink-50">
      <Navbar />
      
      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center pt-16 pb-12 md:pt-24 md:pb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-pink-100 text-pink-700 rounded-full text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            <span>Trusted by thousands of students</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-6 leading-tight">
            Find Your Perfect
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600 animate-gradient">
              {' '}Tutor
            </span>
          </h1>
          
          <p className="mt-6 text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Connect with verified tutors for personalized learning. Choose from
            in-person or online lessons tailored to your needs.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/auth/signup"
              className="group relative bg-gradient-to-r from-pink-600 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-pink-700 hover:to-purple-700 shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              <span>Get Started</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/auth/signup?role=tutor"
              className="bg-white text-pink-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 shadow-lg border-2 border-pink-600 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              <Users className="h-5 w-5" />
              <span>Become a Tutor</span>
            </Link>
          </div>

          {/* Quick Search Bar */}
          <div className="mt-12 max-w-2xl mx-auto">
            <Link
              href="/auth/signup"
              className="block bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-100 hover:border-pink-300 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="flex-1 flex items-center gap-3 text-gray-400 group-hover:text-gray-600">
                  <Search className="h-6 w-6" />
                  <span className="text-lg">Search for tutors by subject, grade, or location...</span>
                </div>
                <div className="px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg font-medium">
                  Search
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-16 mb-20">
          <div className="bg-gradient-to-r from-pink-500 via-purple-600 to-pink-500 rounded-3xl p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="transform hover:scale-105 transition-transform">
                <div className="text-5xl md:text-6xl font-bold mb-3">{stats.tutors}+</div>
                <div className="text-pink-100 text-lg font-medium">Verified Tutors</div>
              </div>
              <div className="transform hover:scale-105 transition-transform">
                <div className="text-5xl md:text-6xl font-bold mb-3">{stats.lessons.toLocaleString()}+</div>
                <div className="text-pink-100 text-lg font-medium">Lessons Completed</div>
              </div>
              <div className="transform hover:scale-105 transition-transform">
                <div className="text-5xl md:text-6xl font-bold mb-3 flex items-center justify-center gap-2">
                  {stats.rating}
                  <Star className="h-8 w-8 fill-yellow-300 text-yellow-300" />
                </div>
                <div className="text-pink-100 text-lg font-medium">Average Rating</div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-24 mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why Choose <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">TutorMe</span>?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need for successful learning in one place
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all border border-gray-100 hover:border-pink-200 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <Search className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-800">Easy Search</h3>
              <p className="text-gray-600 leading-relaxed">
                Find tutors by subject, grade level, location, and price with our powerful search filters
              </p>
            </div>

            <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all border border-gray-100 hover:border-purple-200 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-800">Verified Tutors</h3>
              <p className="text-gray-600 leading-relaxed">
                All tutors are verified and background-checked for your safety and peace of mind
              </p>
            </div>

            <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all border border-gray-100 hover:border-teal-200 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-800">Flexible Scheduling</h3>
              <p className="text-gray-600 leading-relaxed">
                Book lessons that fit your schedule, one-time or recurring sessions available
              </p>
            </div>

            <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all border border-gray-100 hover:border-blue-200 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <Video className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-800">Online & In-Person</h3>
              <p className="text-gray-600 leading-relaxed">
                Choose between virtual lessons or meet in person - whatever works best for you
              </p>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mt-24 mb-20 bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-12 md:p-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              How It <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">Works</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get started in just a few simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="relative inline-block mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-xl">
                  1
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-800">Sign Up</h3>
              <p className="text-gray-600">
                Create your free account in seconds. No credit card required.
              </p>
            </div>

            <div className="text-center">
              <div className="relative inline-block mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-xl">
                  2
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Search className="h-4 w-4 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-800">Find a Tutor</h3>
              <p className="text-gray-600">
                Browse verified tutors, read reviews, and find your perfect match.
              </p>
            </div>

            <div className="text-center">
              <div className="relative inline-block mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-xl">
                  3
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-800">Start Learning</h3>
            <p className="text-gray-600">
                Book your first lesson and begin your learning journey today.
              </p>
            </div>
          </div>
        </div>

        {/* Featured Tutors Section */}
        {featuredTutors.length > 0 && (
          <div className="mt-24 mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Featured <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">Tutors</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Meet some of our top-rated tutors
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredTutors.map((tutor, index) => {
                const avgRating = tutor.reviews.length > 0
                  ? (tutor.reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / tutor.reviews.length).toFixed(1)
                  : tutor.rating.toFixed(1)
                
                return (
                  <div
                    key={tutor.id}
                    className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all p-6 border border-gray-100 transform hover:-translate-y-2"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                        {tutor.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800">{tutor.user.name}</h3>
                        <div className="flex items-center gap-1 text-yellow-500">
                          <Star className="h-4 w-4 fill-current" />
                          <span className="text-sm font-medium text-gray-700">{avgRating}</span>
                          <span className="text-sm text-gray-500">({tutor.reviews.length || tutor.totalReviews} reviews)</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span>Top Rated</span>
                    </div>
                    <Link
                      href="/auth/signup"
                      className="block w-full text-center px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg font-medium hover:from-pink-700 hover:to-purple-700 transition-all"
                    >
                      View Profile
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Additional Benefits */}
        <div className="mt-24 mb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Award className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Quality Guaranteed</h3>
              </div>
              <p className="text-gray-600 text-sm">
                All tutors are carefully vetted and maintain high teaching standards
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Direct Messaging</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Communicate directly with tutors to discuss your learning goals
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Heart className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Satisfaction Guaranteed</h3>
              </div>
              <p className="text-gray-600 text-sm">
                We&apos;re committed to your success. 100% satisfaction or your money back
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 mb-20 bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600 rounded-3xl p-12 md:p-16 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="relative">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Ready to Start Learning?
            </h2>
            <p className="text-xl text-pink-100 mb-8 max-w-2xl mx-auto">
              Join thousands of students already learning with TutorMe. Get started today!
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/auth/signup"
                className="bg-white text-pink-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-100 shadow-xl transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
              >
                <span>Get Started Free</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/auth/signup?role=tutor"
                className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white hover:text-pink-600 shadow-xl transition-all transform hover:-translate-y-1"
              >
                Become a Tutor
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white text-xl font-bold mb-4">TutorMe</h3>
              <p className="text-gray-400">
                Connecting students with the best tutors for personalized learning experiences.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">For Students</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/auth/signup" className="hover:text-white">Find a Tutor</Link></li>
                <li><Link href="/auth/signup" className="hover:text-white">How It Works</Link></li>
                <li><Link href="/auth/signup" className="hover:text-white">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">For Tutors</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/auth/signup?role=tutor" className="hover:text-white">Become a Tutor</Link></li>
                <li><Link href="/auth/signup?role=tutor" className="hover:text-white">Tutor Resources</Link></li>
                <li><Link href="/auth/signup?role=tutor" className="hover:text-white">Earnings</Link></li>
              </ul>
              </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/auth/signup" className="hover:text-white">Help Center</Link></li>
                <li><Link href="/auth/signup" className="hover:text-white">Contact Us</Link></li>
                <li><Link href="/auth/signup" className="hover:text-white">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} TutorMe. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
