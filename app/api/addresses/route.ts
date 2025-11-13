import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-db'
import { z } from 'zod'
import crypto from 'crypto'

function uuidv4() {
  return crypto.randomUUID()
}

const addressSchema = z.object({
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(1, 'Zip code is required'),
  country: z.string().default('USA'),
  isDefault: z.boolean().default(false),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
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
    const validatedData = addressSchema.parse(body)

    // If this is set as default, unset other defaults
    if (validatedData.isDefault) {
      await supabase
        .from('addresses')
        .update({ isDefault: false, updatedAt: new Date().toISOString() })
        .eq('userId', session.user.id)
    }

    // Create address
    const addressId = uuidv4()
    const now = new Date().toISOString()
    
    const addressData: any = {
      id: addressId,
      userId: session.user.id,
      street: validatedData.street,
      city: validatedData.city,
      state: validatedData.state,
      zipCode: validatedData.zipCode,
      country: validatedData.country,
      isDefault: validatedData.isDefault,
      createdAt: now,
      updatedAt: now,
    }
    
    // Add coordinates if provided
    if (validatedData.latitude !== undefined) {
      addressData.latitude = validatedData.latitude
    }
    if (validatedData.longitude !== undefined) {
      addressData.longitude = validatedData.longitude
    }
    
    const { data: address, error: addressError } = await supabase
      .from('addresses')
      .insert(addressData)
      .select()
      .single()
    
    if (addressError) throw addressError

    return NextResponse.json(
      { message: 'Address created successfully', address },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Address creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: addressesData } = await supabase
      .from('addresses')
      .select('*')
      .eq('userId', session.user.id)
      .order('isDefault', { ascending: false })
      .order('createdAt', { ascending: false })
    
    const addresses = addressesData || []

    return NextResponse.json({ addresses })
  } catch (error) {
    console.error('Address fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

