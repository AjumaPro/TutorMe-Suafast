/**
 * Pricing calculation utilities
 * Uses admin-configured pricing rules
 */

import { supabase } from './supabase-db'

export interface PricingRule {
  id: string
  lessonType: 'IN_PERSON' | 'ONLINE'
  pricePerTwoHours: number
  currency: string
  isActive: boolean
}

/**
 * Get pricing rules from database
 */
export async function getPricingRules(): Promise<PricingRule[]> {
  try {
    const { data, error } = await supabase
      .from('pricing_rules')
      .select('*')
      .eq('isActive', true)
      .order('lessonType', { ascending: true })

    if (error) {
      console.error('Error fetching pricing rules:', error)
      // Return default rules if database query fails
      return getDefaultPricingRules()
    }

    return data || getDefaultPricingRules()
  } catch (error) {
    console.error('Error fetching pricing rules:', error)
    return getDefaultPricingRules()
  }
}

/**
 * Get default pricing rules (fallback)
 */
function getDefaultPricingRules(): PricingRule[] {
  return [
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
  ]
}

/**
 * Get pricing rule for a specific lesson type
 */
export async function getPricingRule(
  lessonType: 'IN_PERSON' | 'ONLINE'
): Promise<PricingRule | null> {
  try {
    const { data, error } = await supabase
      .from('pricing_rules')
      .select('*')
      .eq('lessonType', lessonType)
      .eq('isActive', true)
      .single()

    if (error || !data) {
      // Return default rule if not found
      const defaults = getDefaultPricingRules()
      return defaults.find(rule => rule.lessonType === lessonType) || null
    }

    return data
  } catch (error) {
    console.error('Error fetching pricing rule:', error)
    const defaults = getDefaultPricingRules()
    return defaults.find(rule => rule.lessonType === lessonType) || null
  }
}

/**
 * Calculate price based on duration, lesson type, and course type
 * Uses tutor-specific pricing if available, otherwise falls back to admin pricing rules
 * 
 * @param duration - Duration in minutes
 * @param lessonType - 'IN_PERSON' or 'ONLINE'
 * @param tutor - Optional tutor profile with pricing
 * @param courseType - Optional course type ('ACADEMIC' or 'PROFESSIONAL')
 * @param subject - Optional subject name to determine course type
 * @returns Calculated price
 */
export async function calculatePrice(
  duration: number,
  lessonType: 'IN_PERSON' | 'ONLINE',
  tutor?: any,
  courseType?: 'ACADEMIC' | 'PROFESSIONAL',
  subject?: string
): Promise<number> {
  // Import here to avoid circular dependency
  const { getCourseType } = await import('./pricing-validation')
  
  // Determine course type if not provided
  const finalCourseType = courseType || (tutor ? getCourseType(tutor, subject) : 'ACADEMIC')
  
  // For professional courses, use per-hour pricing
  if (finalCourseType === 'PROFESSIONAL' && tutor?.professionalPricePerHour) {
    const hours = duration / 60
    return Math.round((tutor.professionalPricePerHour * hours) * 100) / 100
  }
  
  // For academic courses, use per-2-hours pricing
  if (finalCourseType === 'ACADEMIC') {
    // Check if tutor has custom academic pricing
    if (tutor) {
      if (lessonType === 'IN_PERSON' && tutor.academicInPersonPricePerTwoHours) {
        return Math.round((tutor.academicInPersonPricePerTwoHours * duration) / 120 * 100) / 100
      }
      if (lessonType === 'ONLINE' && tutor.academicOnlinePricePerTwoHours) {
        return Math.round((tutor.academicOnlinePricePerTwoHours * duration) / 120 * 100) / 100
      }
    }
    
    // Fall back to admin pricing rules
    const rule = await getPricingRule(lessonType)
    
    if (!rule) {
      // Fallback to default pricing
      const defaultPricePerTwoHours = lessonType === 'IN_PERSON' ? 50 : 30
      return Math.round((defaultPricePerTwoHours * duration) / 120 * 100) / 100
    }

    // Calculate price: (pricePerTwoHours * duration) / 120
    return Math.round((rule.pricePerTwoHours * duration) / 120 * 100) / 100
  }
  
  // Fallback for professional courses without tutor pricing
  if (finalCourseType === 'PROFESSIONAL') {
    // Default professional pricing: 50 per hour
    const hours = duration / 60
    return Math.round(50 * hours * 100) / 100
  }
  
  // Final fallback
  const defaultPricePerTwoHours = lessonType === 'IN_PERSON' ? 50 : 30
  return Math.round((defaultPricePerTwoHours * duration) / 120 * 100) / 100
}

/**
 * Calculate price synchronously (uses cached/default rules)
 * Use this for client-side calculations
 */
export function calculatePriceSync(
  duration: number,
  lessonType: 'IN_PERSON' | 'ONLINE',
  pricePerTwoHours?: number
): number {
  // Use provided price or default
  const pricePer2H = pricePerTwoHours || (lessonType === 'IN_PERSON' ? 50 : 30)
  
  // Calculate: (pricePerTwoHours * duration) / 120 minutes
  const price = (pricePer2H * duration) / 120
  
  return Math.round(price * 100) / 100 // Round to 2 decimal places
}

