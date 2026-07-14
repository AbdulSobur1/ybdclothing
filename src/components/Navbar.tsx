"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AuthChangeEvent, Session, User as SupabaseUser } from "@supabase/supabase-js";
import { ShoppingBag, Menu, X, User, LogOut, Package, Heart } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient>>(null);

  useEffect(() => {
    setSupabase(createClient());
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!supabase) return;

    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user ?? null);
    };
    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null);
    });

    return () => listener?.subscription.unsubscribe();
  }, [supabase]);

  // Fetch cart count when user changes
  useEffect(() => {
    if (!user) {
      setCartCount(0);
      return;
    }
    fetchCartCount();
  }, [user]);

  // Listen for cart-updated events so the badge reflects changes immediately
  useEffect(() => {
    if (!user) return;
    const handler = () => fetchCartCount();
    window.addEventListener("cart-updated", handler);
    return () => window.removeEventListener("cart-updated", handler);
  }, [user]);

  async function fetchCartCount() {
    try {
      const res = await fetch("/api/cart");
      const data = await res.json();
      setCartCount(data.items?.length ?? 0);
    } catch {
      // ignore
    }
  }

  const handleLogout = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setMobileOpen(false);
    setCartCount(0);
  }, [supabase]);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/shop", label: "Shop" },
    ...(user ? [{ href: "/orders" as const, label: "My Orders" as const }] : []),
    ...(user ? [{ href: "/wishlist" as const, label: "Wishlist" as const }] : []),
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#F2EDE1]/95 backdrop-blur-md border-b border-[#E0D8C8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="text-2xl font-bold tracking-tight hover:opacity-80 transition-opacity"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#4A6B6D" }}
          >
            YBD
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-all duration-200 px-4 py-1.5 rounded-full ${
                  isActive(link.href)
                    ? "bg-[#4A6B6D] text-white shadow-sm"
                    : "text-[#5A5A4A] hover:bg-[#4A6B6D]/10 hover:text-[#4A6B6D]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="hidden md:flex items-center gap-1">
                {/* Cart badge */}
                <Link
                  href="/checkout"
                  className="relative p-2 rounded-full hover:bg-[#E0D8C8] transition-colors text-[#5A5A4A]"
                  title="Cart"
                >
                  <ShoppingBag className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#A6822E] text-white text-[10px] font-bold flex items-center justify-center animate-bounce-in">
                      {cartCount > 9 ? "9+" : cartCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/profile"
                  className={`p-2 rounded-full hover:bg-[#E0D8C8] transition-colors ${
                    isActive("/profile") ? "text-[#4A6B6D]" : "text-[#5A5A4A]"
                  }`}
                  title="Profile"
                >
                  <User className="h-5 w-5" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-full hover:bg-[#E0D8C8] transition-colors text-[#5A5A4A] hover:text-red-500"
                  title="Log out"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 text-sm font-medium rounded-full text-[#5A5A4A] hover:text-[#4A6B6D] hover:bg-[#E0D8C8] transition-all"
                >
                  Sign Up
                </Link>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-full border border-[#4A6B6D] text-[#4A6B6D] hover:bg-[#4A6B6D] hover:text-white transition-all"
                >
                  Sign In
                </Link>
              </div>
            )}

            {/* Cart badge on mobile */}
            <Link
              href="/checkout"
              className="relative p-2 rounded-full hover:bg-[#E0D8C8] transition-colors text-[#5A5A4A] md:hidden"
              title="Cart"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#A6822E] text-white text-[10px] font-bold flex items-center justify-center animate-bounce-in">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-full hover:bg-[#E0D8C8] transition-colors text-[#5A5A4A]"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu with slide animation */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileOpen ? "max-h-96 border-t border-[#E0D8C8]" : "max-h-0"
        }`}
      >
        <div className="bg-[#F2EDE1] px-4 py-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? "bg-[#4A6B6D] text-white"
                  : "text-[#5A5A4A] hover:bg-[#E0D8C8]"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link
                href="/wishlist"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#5A5A4A] hover:bg-[#E0D8C8] transition-colors"
              >
                <Heart className="h-4 w-4" /> Wishlist
              </Link>
              <Link
                href="/profile"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#5A5A4A] hover:bg-[#E0D8C8] transition-colors"
              >
                <User className="h-4 w-4" /> Profile
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full text-left transition-colors"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm font-medium border border-[#4A6B6D] text-[#4A6B6D] text-center hover:bg-[#4A6B6D] hover:text-white transition-all"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm font-medium bg-[#A6822E] text-white text-center hover:bg-[#8E6E1F] transition-all"
              >
                Create Account
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
