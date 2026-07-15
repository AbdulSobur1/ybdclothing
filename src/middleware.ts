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

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
