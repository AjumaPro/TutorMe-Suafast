import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import { prisma } from '@/lib/prisma'
import TutorSearch from '@/components/TutorSearch'

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  const subject = searchParams.subject as string
  const grade = searchParams.grade as string
  const minRate = searchParams.minRate ? parseFloat(searchParams.minRate as string) : undefined
  const maxRate = searchParams.maxRate ? parseFloat(searchParams.maxRate as string) : undefined

  // Build search query - subjects and grades are JSON strings, so we filter in JavaScript
  const where: any = {
    isApproved: true,
  }

  // Filter by hourly rate in Prisma query
  if (minRate !== undefined || maxRate !== undefined) {
    where.hourlyRate = {}
    if (minRate !== undefined) where.hourlyRate.gte = minRate
    if (maxRate !== undefined) where.hourlyRate.lte = maxRate
  }

  // Fetch all approved tutors
  const allTutors = await prisma.tutorProfile.findMany({
    where,
    include: {
      user: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: {
      rating: 'desc',
    },
  })

  // Filter by subject and grade in JavaScript (since they're stored as JSON strings)
  let tutors = allTutors
  if (subject || grade) {
    tutors = allTutors.filter((tutor) => {
      // Parse subjects and grades from JSON strings
      const subjects = JSON.parse(tutor.subjects || '[]')
      const grades = JSON.parse(tutor.grades || '[]')
      
      // Filter by subject
      if (subject && !subjects.includes(subject)) {
        return false
      }
      
      // Filter by grade
      if (grade && !grades.includes(grade)) {
        return false
      }
      
      return true
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Find a Tutor</h1>
          <p className="text-gray-600">Search for tutors by subject, grade level, and more</p>
        </div>
        <TutorSearch tutors={tutors} initialFilters={{ subject, grade, minRate, maxRate }} />
      </div>
    </div>
  )
}

