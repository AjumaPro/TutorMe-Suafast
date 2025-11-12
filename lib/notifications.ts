import { prisma } from './prisma'

export type NotificationType =
  | 'BOOKING_CREATED'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_FAILED'
  | 'REVIEW_RECEIVED'
  | 'MESSAGE_RECEIVED'
  | 'LESSON_REMINDER'
  | 'ASSIGNMENT_SUBMITTED'
  | 'ASSIGNMENT_REVIEWED'
  | 'PROGRESS_UPDATED'

interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  message: string
  link?: string
  metadata?: Record<string, any>
}

export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
  metadata,
}: CreateNotificationParams) {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    })
  } catch (error) {
    console.error('Error creating notification:', error)
    throw error
  }
}

