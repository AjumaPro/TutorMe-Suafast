/**
 * Security utilities for data sanitization and access control
 * Prevents email exposure and unauthorized data linkage
 */

export interface SanitizedUser {
  id: string
  name: string
  image?: string | null
  // Email and phone are only included if explicitly allowed
  email?: string
  phone?: string
}

/**
 * Sanitize user data based on context and relationship
 * @param user - Full user object from database
 * @param context - Context of the request (self, booking_partner, public, admin)
 * @param includeEmail - Whether to include email (only for self or admin)
 * @param includePhone - Whether to include phone (only for self, booking_partner, or admin)
 */
export function sanitizeUser(
  user: any,
  context: 'self' | 'booking_partner' | 'public' | 'admin' = 'public',
  includeEmail: boolean = false,
  includePhone: boolean = false
): SanitizedUser {
  if (!user) return null as any

  const sanitized: SanitizedUser = {
    id: user.id,
    name: user.name,
    image: user.image || null,
  }

  // Email rules:
  // - Only include if explicitly requested AND (self, admin, or booking_partner with permission)
  if (includeEmail && (context === 'self' || context === 'admin' || context === 'booking_partner')) {
    sanitized.email = user.email
  }

  // Phone rules:
  // - Only include if explicitly requested AND (self, admin, or booking_partner)
  if (includePhone && (context === 'self' || context === 'admin' || context === 'booking_partner')) {
    sanitized.phone = user.phone || null
  }

  return sanitized
}

/**
 * Sanitize tutor profile data
 * @param tutor - Tutor profile object
 * @param context - Context of the request
 */
export function sanitizeTutorProfile(tutor: any, context: 'self' | 'public' | 'admin' = 'public') {
  if (!tutor) return null

  const sanitized = {
    id: tutor.id,
    bio: tutor.bio,
    subjects: tutor.subjects,
    grades: tutor.grades,
    hourlyRate: tutor.hourlyRate,
    currency: tutor.currency,
    experience: tutor.experience,
    isVerified: tutor.isVerified,
    isApproved: tutor.isApproved,
    rating: tutor.rating,
    totalReviews: tutor.totalReviews,
    city: tutor.city,
    state: tutor.state,
    zipCode: tutor.zipCode,
    // Only include credentials for self or admin
    credentials: context === 'self' || context === 'admin' ? tutor.credentials : null,
  }

  return sanitized
}

/**
 * Check if user has access to view another user's data
 * @param viewerId - ID of the user requesting access
 * @param viewerRole - Role of the viewer
 * @param targetUserId - ID of the user whose data is being accessed
 * @param relationship - Relationship type (booking_partner, same_booking, etc.)
 */
export function canAccessUserData(
  viewerId: string,
  viewerRole: string,
  targetUserId: string,
  relationship?: 'booking_partner' | 'same_booking' | 'none'
): boolean {
  // Self access is always allowed
  if (viewerId === targetUserId) {
    return true
  }

  // Admins can access all data
  if (viewerRole === 'ADMIN') {
    return true
  }

  // Booking partners can see limited data
  if (relationship === 'booking_partner' || relationship === 'same_booking') {
    return true
  }

  return false
}

/**
 * Sanitize booking data based on viewer context
 * @param booking - Booking object
 * @param viewerId - ID of the user viewing the booking
 * @param viewerRole - Role of the viewer
 */
export function sanitizeBooking(booking: any, viewerId: string, viewerRole: string) {
  if (!booking) return null

  const sanitized: any = {
    id: booking.id,
    subject: booking.subject,
    scheduledAt: booking.scheduledAt,
    duration: booking.duration,
    price: booking.price,
    currency: booking.currency,
    status: booking.status,
    lessonType: booking.lessonType,
    notes: booking.notes,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
  }

  // Include tutor data
  if (booking.tutor) {
    const isTutorSelf = booking.tutor.userId === viewerId
    sanitized.tutor = {
      ...sanitizeTutorProfile(booking.tutor, isTutorSelf ? 'self' : 'public'),
      user: booking.tutor.user
        ? sanitizeUser(
            booking.tutor.user,
            isTutorSelf ? 'self' : viewerRole === 'ADMIN' ? 'admin' : 'public',
            isTutorSelf || viewerRole === 'ADMIN', // Include email for self or admin
            false // Don't include phone for tutors
          )
        : null,
    }
  }

  // Include student data
  if (booking.student) {
    const isStudentSelf = booking.studentId === viewerId
    const isBookingPartner =
      (viewerRole === 'TUTOR' && booking.tutorId) ||
      (viewerRole === 'PARENT' && booking.studentId === viewerId)

    sanitized.student = sanitizeUser(
      booking.student,
      isStudentSelf ? 'self' : isBookingPartner ? 'booking_partner' : 'public',
      isStudentSelf || viewerRole === 'ADMIN', // Include email for self or admin
      isBookingPartner || viewerRole === 'ADMIN' // Include phone for booking partners or admin
    )
  }

  // Include address only for booking partners or admin
  if (booking.studentAddress) {
    const isBookingPartner =
      (viewerRole === 'TUTOR' && booking.tutorId) ||
      (viewerRole === 'PARENT' && booking.studentId === viewerId)

    if (isBookingPartner || viewerRole === 'ADMIN') {
      sanitized.studentAddress = booking.studentAddress
    }
  }

  return sanitized
}

/**
 * Remove sensitive fields from user object
 */
export function removeSensitiveFields(user: any): any {
  if (!user) return null

  const { password, resetToken, resetTokenExpiry, totpSecret, backupCodes, emailOtpCode, smsOtpCode, ...safeUser } = user
  return safeUser
}

