import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const privacySettingsSchema = z.object({
  profileVisibility: z.enum(['PUBLIC', 'PRIVATE']),
  showEmail: z.boolean(),
  showPhone: z.boolean(),
})

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // For now, return defaults. In production, store in User model
    return NextResponse.json({
      profileVisibility: 'PUBLIC',
      showEmail: false,
      showPhone: false,
    })
  } catch (error) {
    console.error('Privacy settings fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = privacySettingsSchema.parse(body)

    // In production, store in User model
    // TODO: Add privacy fields to User model

    return NextResponse.json(
      { message: 'Privacy settings updated successfully', settings: validatedData },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Privacy settings update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

