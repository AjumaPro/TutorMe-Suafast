import { supabase } from './supabase-db'

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
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        userId,
        type,
        title,
        message,
        link: link || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        isRead: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating notification:', error)
    throw error
  }
}

