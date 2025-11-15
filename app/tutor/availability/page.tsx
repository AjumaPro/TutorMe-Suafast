import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import DashboardSidebar from '@/components/DashboardSidebar'
import AvailabilityCalendar from '@/components/AvailabilityCalendar'
import { Calendar, Clock, Info } from 'lucide-react'

export default async function TutorAvailabilityPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'TUTOR') {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col lg:ml-0">
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Availability</h1>
              <p className="text-gray-600">Set your weekly schedule so students can book lessons with you</p>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-1">How Availability Works</h3>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Set your available hours for each day of the week</li>
                    <li>Students will see your availability when booking</li>
                    <li>Admins can assign students to you during your available hours</li>
                    <li>You can update your availability at any time</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Availability Calendar */}
            <AvailabilityCalendar />
          </div>
        </main>
      </div>
    </div>
  )
}

