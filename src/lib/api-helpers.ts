import { NextResponse } from "next/server";

// ──────────────────────────────────────────────
// Error-handling wrapper for API routes
// ──────────────────────────────────────────────

type ApiHandler = (
  request: Request,
  ...args: unknown[]
) => Promise<NextResponse<unknown>>;

/**
 * Wraps an API route handler in a try-catch so unhandled errors
 * always return a proper JSON error response (never raw stack traces).
 */
export function withErrorHandling(handler: ApiHandler): ApiHandler {
  return async (request: Request, ...args: unknown[]) => {
    try {
      return await handler(request, ...args);
    } catch (error) {
      console.error("API Error:", error);
      return NextResponse.json(
        { error: "Something went wrong. Please try again." },
        { status: 500 },
      );
    }
  };
}

// ──────────────────────────────────────────────
// Input validation
// ──────────────────────────────────────────────

/**
 * Validates that a value is a positive integer (for IDs, quantities, etc.).
 * Returns `null` if valid, or an error message string if invalid.
 */
export function validatePositiveInteger(value: unknown, fieldName: string): string | null {
  if (value === undefined || value === null) {
    return `${fieldName} is required`;
  }
  const num = Number(value);
  if (!Number.isInteger(num) || num < 1) {
    return `${fieldName} must be a positive integer`;
  }
  return null;
}

/**
 * Validates that a value is a non-empty string.
 */
export function validateNonEmptyString(value: unknown, fieldName: string): string | null {
  if (!value || typeof value !== "string" || value.trim().length === 0) {
    return `${fieldName} is required`;
  }
  return null;
}

/**
 * Validates that an object has the required fields.
 * Returns an array of missing/invalid field error messages.
 */
export function validateRequiredFields<T extends Record<string, unknown>>(
  body: T,
  requiredFields: (keyof T)[],
): string[] {
  const errors: string[] = [];
  for (const field of requiredFields) {
    const value = body[field];
    if (value === undefined || value === null) {
      errors.push(`${String(field)} is required`);
    }
  }
  return errors;
}

// ──────────────────────────────────────────────
// Content-Type validation
// ──────────────────────────────────────────────

/**
 * Validates that the request has the expected Content-Type header.
 * Returns an error response if invalid, or `null` if valid.
 */
export function requireContentType(
  request: Request,
  expectedType: string = "application/json",
): NextResponse<{ error: string }> | null {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes(expectedType)) {
    return NextResponse.json(
      { error: `Expected Content-Type: ${expectedType}` },
      { status: 415 },
    );
  }
  return null;
}

// ──────────────────────────────────────────────
// Simple in-memory rate limiter
// ──────────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore) {
      if (entry.resetAt < now) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

/**
 * Creates a rate limiter keyed by a combination of identifier (e.g., IP + route).
 * Uses a sliding window approach.
 *
 * @param identifier - Unique key (e.g., `ip:route`)
 * @param maxRequests - Maximum requests allowed in the window
 * @param windowMs - Time window in milliseconds (default: 60 seconds)
 * @returns Object with `allowed` boolean and `remaining` count
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 30,
  windowMs: number = 60_000,
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || entry.resetAt < now) {
    // First request or window expired — start new window
    rateLimitStore.set(identifier, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count };
}

/**
 * Middleware-style rate limit check for API routes.
 * Returns a 429 response if rate limited, or `null` if allowed.
 */
export function rateLimit(
  request: Request,
  maxRequests: number = 30,
  windowMs: number = 60_000,
): NextResponse<{ error: string; retryAfter: number }> | null {
  const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown";
  const url = new URL(request.url);
  const identifier = `${ip}:${url.pathname}`;

  const result = checkRateLimit(identifier, maxRequests, windowMs);
  if (!result.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later.", retryAfter: Math.ceil(windowMs / 1000) },
      { status: 429 },
    );
  }
  return null;
}
