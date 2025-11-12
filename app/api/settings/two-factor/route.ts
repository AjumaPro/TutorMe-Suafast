import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const twoFactorSchema = z.object({
  enabled: z.boolean(),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = twoFactorSchema.parse(body)

    // In a real application, you would save 2FA settings to the database
    // For now, we'll just return a success message
    console.log(`User ${session.user.id} ${validatedData.enabled ? 'enabled' : 'disabled'} 2FA`)

    return NextResponse.json(
      { message: `Two-factor authentication ${validatedData.enabled ? 'enabled' : 'disabled'}` },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('2FA update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

