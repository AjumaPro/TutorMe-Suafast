import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-db'
import { z } from 'zod'

const pricingRuleSchema = z.object({
  lessonType: z.enum(['IN_PERSON', 'ONLINE']),
  pricePerTwoHours: z.number().min(0, 'Price must be positive'),
  currency: z.string().optional().default('GHS'),
  isActive: z.boolean().optional().default(true),
})

// Get all pricing rules
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const { data: rules, error } = await supabase
      .from('pricing_rules')
      .select('*')
      .order('lessonType', { ascending: true })

      if (error) {
        console.error('Error fetching pricing rules:', error)
        console.error('Error code:', error.code)
        console.error('Error message:', error.message)
        console.error('Error details:', error.details)
        console.error('Error hint:', error.hint)
        
        // Check if table doesn't exist (PostgREST error code PGRST205)
        if (error.code === '42P01' || error.code === 'PGRST205' || error.message?.includes('does not exist') || error.message?.includes('Could not find the table')) {
          return NextResponse.json(
            { 
              error: 'Pricing rules table not found. If you just created it, wait 30-60 seconds for schema cache to refresh, then reload the schema cache in Supabase Dashboard > Settings > API > Reload Schema Cache',
              code: 'TABLE_NOT_FOUND',
              hint: 'The table may exist but PostgREST schema cache needs to refresh. Go to Supabase Dashboard > Settings > API > Click "Reload Schema Cache"'
            },
            { status: 500 }
          )
        }
        
        return NextResponse.json(
          { error: `Failed to fetch pricing rules: ${error.message || 'Database error'}` },
          { status: 500 }
        )
      }

    return NextResponse.json({ rules: rules || [] }, { status: 200 })
  } catch (error) {
    console.error('Pricing rules fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Create or update pricing rule
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = pricingRuleSchema.parse(body)

    // Check if rule exists for this lesson type
    const { data: existingRule } = await supabase
      .from('pricing_rules')
      .select('*')
      .eq('lessonType', validatedData.lessonType)
      .single()

    let result
    if (existingRule) {
      // Update existing rule
      const { data, error } = await supabase
        .from('pricing_rules')
        .update({
          pricePerTwoHours: validatedData.pricePerTwoHours,
          currency: validatedData.currency || 'GHS',
          isActive: validatedData.isActive !== undefined ? validatedData.isActive : true,
          updatedAt: new Date().toISOString(),
        })
        .eq('lessonType', validatedData.lessonType)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      // Create new rule
      const { data, error } = await supabase
        .from('pricing_rules')
        .insert({
          lessonType: validatedData.lessonType,
          pricePerTwoHours: validatedData.pricePerTwoHours,
          currency: validatedData.currency || 'GHS',
          isActive: validatedData.isActive !== undefined ? validatedData.isActive : true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      result = data
    }

    return NextResponse.json(
      {
        message: `Pricing rule ${existingRule ? 'updated' : 'created'} successfully`,
        rule: result,
      },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Pricing rule update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

