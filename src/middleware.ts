import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Routes that require authentication
const protectedRoutes = ["/checkout", "/orders", "/profile", "/wishlist", "/waitlist"];

// Admin routes — require authentication, redirect to admin login
const adminRoutes = ["/admin"];

// Routes that should redirect logged-in users away (auth pages)
const authRoutes = ["/auth/login", "/auth/signup"];

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Admin routes — redirect to admin login if not authenticated
  // Skip /admin/login itself to avoid redirect loops
  if (adminRoutes.some((route) => pathname.startsWith(route) && pathname !== "/admin/login")) {
    if (!user) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  // Protected routes — redirect to login if not authenticated
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!user) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Auth routes — redirect to home if already authenticated
  if (authRoutes.some((route) => pathname.startsWith(route))) {
    if (user) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Add security headers to all responses
  const response = supabaseResponse;
  
  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");
  
  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");
  
  // Enable HSTS (HTTP Strict Transport Security)
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload",
  );
  
  // Block requests from other sites (referrer policy)
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  
  // Restrict API/feature permissions
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()",
  );
  
  // Content Security Policy — prevents XSS and data injection
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https: ",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://wa.me",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  );

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
