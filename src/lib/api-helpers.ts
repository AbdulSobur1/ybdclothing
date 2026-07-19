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
// Rate limiter (Supabase-backed for serverless compatibility)
// ──────────────────────────────────────────────

import { db } from "@/lib/db";
import { rateLimits } from "@/lib/db/schema";
import { and, eq, gt, lt } from "drizzle-orm";

/**
 * Serverless-compatible rate limiter using Supabase (Drizzle) as the backend store.
 *
 * Works across all Vercel function instances because all instances share
 * the same Postgres database. Uses upsert semantics with a rolling window.
 *
 * @param identifier - Unique key (e.g., `ip:route`)
 * @param maxRequests - Maximum requests allowed in the window
 * @param windowMs - Time window in milliseconds (default: 60 seconds)
 * @returns Object with `allowed` boolean and `remaining` count
 */
export async function checkRateLimit(
  identifier: string,
  maxRequests: number = 30,
  windowMs: number = 60_000,
): Promise<{ allowed: boolean; remaining: number }> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);

  try {
    // Clean up expired entries for this identifier
    await db
      .delete(rateLimits)
      .where(
        and(
          eq(rateLimits.identifier, identifier),
          lt(rateLimits.resetAt, now), // expired
        ),
      );

    // Try to find and update an existing non-expired entry
    const [existing] = await db
      .select()
      .from(rateLimits)
      .where(
        and(
          eq(rateLimits.identifier, identifier),
          gt(rateLimits.resetAt, now), // still within window
        ),
      )
      .limit(1);

    if (existing) {
      if (existing.count >= maxRequests) {
        return { allowed: false, remaining: 0 };
      }

      await db
        .update(rateLimits)
        .set({ count: existing.count + 1 })
        .where(eq(rateLimits.id, existing.id));

      return { allowed: true, remaining: maxRequests - existing.count - 1 };
    }

    // No active entry — insert a new one
    await db.insert(rateLimits).values({
      identifier,
      count: 1,
      resetAt,
    });

    return { allowed: true, remaining: maxRequests - 1 };
  } catch (error) {
    // If rate limiting fails (e.g., DB hiccup), allow the request through
    // rather than blocking legitimate traffic
    console.error("Rate limiter error:", error);
    return { allowed: true, remaining: maxRequests };
  }
}

/**
 * Middleware-style rate limit check for API routes.
 * Returns a 429 response if rate limited, or `null` if allowed.
 */
export async function rateLimit(
  request: Request,
  maxRequests: number = 30,
  windowMs: number = 60_000,
): Promise<NextResponse<{ error: string; retryAfter: number }> | null> {
  const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown";
  const url = new URL(request.url);
  const identifier = `${ip}:${url.pathname}`;

  const result = await checkRateLimit(identifier, maxRequests, windowMs);
  if (!result.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later.", retryAfter: Math.ceil(windowMs / 1000) },
      { status: 429 },
    );
  }
  return null;
}
