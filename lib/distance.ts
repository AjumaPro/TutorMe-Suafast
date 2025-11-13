/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  
  return distance
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Calculate distance-based surcharge percentage
 * Distance ranges:
 * - 0-5 km: No surcharge (0%)
 * - 5-10 km: 5% surcharge
 * - 10-20 km: 10% surcharge
 * - 20-30 km: 20% surcharge
 * - 30-50 km: 30% surcharge
 * - 50+ km: 50% surcharge or suggest online
 */
export function getDistanceSurcharge(distanceKm: number): {
  percentage: number
  shouldSuggestOnline: boolean
} {
  if (distanceKm <= 5) {
    return { percentage: 0, shouldSuggestOnline: false }
  } else if (distanceKm <= 10) {
    return { percentage: 5, shouldSuggestOnline: false }
  } else if (distanceKm <= 20) {
    return { percentage: 10, shouldSuggestOnline: false }
  } else if (distanceKm <= 30) {
    return { percentage: 20, shouldSuggestOnline: false }
  } else if (distanceKm <= 50) {
    return { percentage: 30, shouldSuggestOnline: false }
  } else {
    return { percentage: 50, shouldSuggestOnline: true }
  }
}

/**
 * Format distance for display
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`
  }
  return `${distanceKm.toFixed(1)}km`
}

/**
 * Get coordinates from address using geocoding
 * This is a placeholder - in production, use a geocoding service like Google Maps API
 */
export async function geocodeAddress(
  address: string,
  city: string,
  state: string,
  zipCode: string
): Promise<{ lat: number; lng: number } | null> {
  // In production, use a geocoding service
  // For now, return null and let the user enter coordinates manually
  // or use a client-side geocoding library
  return null
}

