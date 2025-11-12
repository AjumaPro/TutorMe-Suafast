import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const reassignSchema = z.object({
  tutorId: z.string().optional(),
  studentId: z.string().optional(),
  subject: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
  duration: z.number().min(30).max(180).optional(),
  price: z.number().min(0).optional(),
})

// Reassign student to different tutor or change class details
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = reassignSchema.parse(body)

    // Get the booking
    const booking = await prisma.booking.findUnique({
      where: { id },
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Class assignment not found' },
        { status: 404 }
      )
    }

    // Verify new tutor if provided
    if (validatedData.tutorId) {
      const tutor = await prisma.tutorProfile.findUnique({
        where: { id: validatedData.tutorId },
      })

      if (!tutor || !tutor.isApproved) {
        return NextResponse.json(
          { error: 'Tutor not found or not approved' },
          { status: 404 }
        )
      }
    }

    // Verify new student if provided
    if (validatedData.studentId) {
      const student = await prisma.user.findUnique({
        where: { id: validatedData.studentId },
      })

      if (!student || student.role !== 'PARENT') {
        return NextResponse.json(
          { error: 'Student not found' },
          { status: 404 }
        )
      }
    }

    // Update booking
    const updateData: any = {}
    if (validatedData.tutorId) updateData.tutorId = validatedData.tutorId
    if (validatedData.studentId) updateData.studentId = validatedData.studentId
    if (validatedData.subject) updateData.subject = validatedData.subject
    if (validatedData.scheduledAt) updateData.scheduledAt = new Date(validatedData.scheduledAt)
    if (validatedData.duration) updateData.duration = validatedData.duration
    if (validatedData.price) updateData.price = validatedData.price
    updateData.notes = booking.notes
      ? `${booking.notes} | Reassigned by administrator`
      : 'Reassigned by administrator'

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        student: {
          select: {
            name: true,
            email: true,
          },
        },
        tutor: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({
      message: 'Class reassigned successfully',
      booking: updatedBooking,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Reassign error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

