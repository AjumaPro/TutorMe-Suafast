/**
 * Pricing validation utilities
 * Validates tutor prices against course type limits
 */

export type CourseType = 'ACADEMIC' | 'PROFESSIONAL'
export type LessonType = 'IN_PERSON' | 'ONLINE'

export interface PricingLimits {
  academicInPersonMax: number // Max per 2 hours
  academicOnlineMax: number // Max per 2 hours
  professionalMin: number // Min per hour
  professionalMax: number // Max per hour
}

export const PRICING_LIMITS: PricingLimits = {
  academicInPersonMax: 50, // ₵50 per 2 hours
  academicOnlineMax: 30, // ₵30 per 2 hours
  professionalMin: 50, // ₵50 per hour minimum
  professionalMax: 100, // ₵100 per hour maximum
}

/**
 * Determine course type from tutor profile
 */
export function getCourseType(tutor: any, subject?: string): CourseType {
  // Check lessonCategories first
  if (tutor.lessonCategories) {
    const categories = Array.isArray(tutor.lessonCategories)
      ? tutor.lessonCategories
      : JSON.parse(tutor.lessonCategories || '[]')
    
    if (categories.includes('PROFESSIONAL_TECHNICAL')) {
      return 'PROFESSIONAL'
    }
  }

  // Check subjects if provided
  if (subject) {
    const professionalSubjects = [
      'Programming & Software Development',
      'Web Development',
      'Data Science & Analytics',
      'Cybersecurity',
      'Cloud Computing',
      'Digital Marketing',
      'Graphic Design',
      'Video Editing',
      'Photography',
      'Business & Entrepreneurship',
      'Project Management',
      'Accounting & Finance',
      'Excel & Data Analysis',
      'Public Speaking',
      'Professional Writing',
      'Language Learning (Business)',
      'Other Professional',
    ]
    
    if (professionalSubjects.includes(subject)) {
      return 'PROFESSIONAL'
    }
  }

  // Check tutor subjects
  if (tutor.subjects) {
    const subjects = Array.isArray(tutor.subjects)
      ? tutor.subjects
      : JSON.parse(tutor.subjects || '[]')
    
    const professionalSubjects = [
      'Programming & Software Development',
      'Web Development',
      'Data Science & Analytics',
      'Cybersecurity',
      'Cloud Computing',
      'Digital Marketing',
      'Graphic Design',
      'Video Editing',
      'Photography',
      'Business & Entrepreneurship',
      'Project Management',
      'Accounting & Finance',
      'Excel & Data Analysis',
      'Public Speaking',
      'Professional Writing',
      'Language Learning (Business)',
      'Other Professional',
    ]
    
    if (subjects.some((s: string) => professionalSubjects.includes(s))) {
      return 'PROFESSIONAL'
    }
  }

  // Default to ACADEMIC
  return 'ACADEMIC'
}

/**
 * Validate academic in-person price (per 2 hours)
 */
export function validateAcademicInPersonPrice(price: number): { valid: boolean; error?: string } {
  if (price < 0) {
    return { valid: false, error: 'Price cannot be negative' }
  }
  if (price > PRICING_LIMITS.academicInPersonMax) {
    return {
      valid: false,
      error: `Price cannot exceed ₵${PRICING_LIMITS.academicInPersonMax} per 2 hours for academic in-person lessons`,
    }
  }
  return { valid: true }
}

/**
 * Validate academic online price (per 2 hours)
 */
export function validateAcademicOnlinePrice(price: number): { valid: boolean; error?: string } {
  if (price < 0) {
    return { valid: false, error: 'Price cannot be negative' }
  }
  if (price > PRICING_LIMITS.academicOnlineMax) {
    return {
      valid: false,
      error: `Price cannot exceed ₵${PRICING_LIMITS.academicOnlineMax} per 2 hours for academic online lessons`,
    }
  }
  return { valid: true }
}

/**
 * Validate professional price (per hour)
 */
export function validateProfessionalPrice(price: number): { valid: boolean; error?: string } {
  if (price < PRICING_LIMITS.professionalMin) {
    return {
      valid: false,
      error: `Professional course price must be at least ₵${PRICING_LIMITS.professionalMin} per hour`,
    }
  }
  if (price > PRICING_LIMITS.professionalMax) {
    return {
      valid: false,
      error: `Professional course price cannot exceed ₵${PRICING_LIMITS.professionalMax} per hour`,
    }
  }
  return { valid: true }
}

/**
 * Validate all tutor pricing fields
 */
export function validateTutorPricing(pricing: {
  academicInPersonPricePerTwoHours?: number
  academicOnlinePricePerTwoHours?: number
  professionalPricePerHour?: number
}): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (pricing.academicInPersonPricePerTwoHours !== undefined) {
    const result = validateAcademicInPersonPrice(pricing.academicInPersonPricePerTwoHours)
    if (!result.valid && result.error) {
      errors.push(result.error)
    }
  }

  if (pricing.academicOnlinePricePerTwoHours !== undefined) {
    const result = validateAcademicOnlinePrice(pricing.academicOnlinePricePerTwoHours)
    if (!result.valid && result.error) {
      errors.push(result.error)
    }
  }

  if (pricing.professionalPricePerHour !== undefined) {
    const result = validateProfessionalPrice(pricing.professionalPricePerHour)
    if (!result.valid && result.error) {
      errors.push(result.error)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

