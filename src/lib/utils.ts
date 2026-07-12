/**
 * Format a price stored in kobo (NGN × 100) to a display string.
 * E.g. 18000 → "₦18,000"
 */
export function formatPrice(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString()}`;
}

/**
 * Convert a Naira amount string (e.g. "18000") to kobo.
 */
export function nairaToKobo(naira: number): number {
  return Math.round(naira * 100);
}

/**
 * Check if a value is a plain object.
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Sleep helper (useful for simulating delays in development).
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
