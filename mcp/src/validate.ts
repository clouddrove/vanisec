export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

// Mirrors ALLOWED_EXPIRY_HOURS in app/api/secrets/route.ts. Checked here so a
// bad value fails before a network round trip.
export const ALLOWED_EXPIRY_HOURS = [1, 6, 24, 72, 168] as const
export const DEFAULT_EXPIRY_HOURS = 24

export function validateExpiry(hours: number | undefined): number {
  if (hours === undefined) return DEFAULT_EXPIRY_HOURS
  if (!Number.isInteger(hours) || !ALLOWED_EXPIRY_HOURS.includes(hours as never)) {
    throw new ValidationError(
      `expiresIn must be one of ${ALLOWED_EXPIRY_HOURS.join(', ')} hours, got ${hours}`
    )
  }
  return hours
}

export function validateNonEmpty(value: string, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ValidationError(`${field} must be a non-empty string`)
  }
  return value
}
