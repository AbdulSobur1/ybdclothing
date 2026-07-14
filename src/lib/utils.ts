/**
 * Format a price to a display string.
 * Price is stored directly in Naira (e.g. 18000 → "₦18,000").
 */
export function formatPrice(amount: number): string {
  return `₦${amount.toLocaleString()}`;
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
