'use client'

import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import Image from 'next/image'

interface ReviewsListProps {
  tutorId: string
}

interface Review {
  id: string
  rating: number
  comment: string | null
  createdAt: string
  student: {
    name: string
    image: string | null
  }
  booking: {
    subject: string
    scheduledAt: string
  }
}

export default function ReviewsList({ tutorId }: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(`/api/reviews?tutorId=${tutorId}`)
        if (response.ok) {
          const data = await response.json()
          setReviews(data.reviews || [])
        }
      } catch (err) {
        console.error('Failed to fetch reviews:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
  }, [tutorId])

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto"></div>
        <p className="text-gray-600 mt-2">Loading reviews...</p>
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No reviews yet</p>
        <p className="text-sm text-gray-400 mt-2">Be the first to review this tutor!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <div key={review.id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
              {review.student.image ? (
                <Image
                  src={review.student.image}
                  alt={review.student.name}
                  width={48}
                  height={48}
                  className="rounded-full"
                  unoptimized
                />
              ) : (
                review.student.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-gray-800">{review.student.name}</h4>
                  <p className="text-sm text-gray-500">
                    {review.booking.subject} • {new Date(review.booking.scheduledAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= review.rating
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              {review.comment && (
                <p className="text-gray-700 mt-2">{review.comment}</p>
              )}
              <p className="text-xs text-gray-400 mt-2">
                {new Date(review.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

