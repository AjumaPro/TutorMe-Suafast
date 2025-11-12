// Helper functions for handling JSON arrays in SQLite

export function parseJsonArray(value: string | string[]): string[] {
  if (Array.isArray(value)) {
    return value
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

export function stringifyJsonArray(value: string[]): string {
  return JSON.stringify(value)
}

