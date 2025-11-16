import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-db'

// Get pricing rules (public endpoint for client-side calculations)
export async function GET() {
  try {
    const { data: rules, error } = await supabase
      .from('pricing_rules')
      .select('*')
      .eq('isActive', true)
      .order('lessonType', { ascending: true })

    if (error) {
      console.error('Error fetching pricing rules:', error)
      // Return default rules if database query fails
      return NextResponse.json({
        rules: [
          {
            id: 'default_inperson',
            lessonType: 'IN_PERSON',
            pricePerTwoHours: 50.00,
            currency: 'GHS',
            isActive: true,
          },
          {
            id: 'default_online',
            lessonType: 'ONLINE',
            pricePerTwoHours: 30.00,
            currency: 'GHS',
            isActive: true,
          },
        ],
      })
    }

    // If no rules found, return defaults
    if (!rules || rules.length === 0) {
      return NextResponse.json({
        rules: [
          {
            id: 'default_inperson',
            lessonType: 'IN_PERSON',
            pricePerTwoHours: 50.00,
            currency: 'GHS',
            isActive: true,
          },
          {
            id: 'default_online',
            lessonType: 'ONLINE',
            pricePerTwoHours: 30.00,
            currency: 'GHS',
            isActive: true,
          },
        ],
      })
    }

    return NextResponse.json({ rules }, { status: 200 })
  } catch (error) {
    console.error('Pricing rules fetch error:', error)
    // Return default rules on error
    return NextResponse.json({
      rules: [
        {
          id: 'default_inperson',
          lessonType: 'IN_PERSON',
          pricePerTwoHours: 50.00,
          currency: 'GHS',
          isActive: true,
        },
        {
          id: 'default_online',
          lessonType: 'ONLINE',
          pricePerTwoHours: 30.00,
          currency: 'GHS',
          isActive: true,
        },
      ],
    })
  }
}

