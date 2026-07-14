"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { UserPlus, Eye, EyeOff } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient>>(null);

  useEffect(() => {
    setSupabase(createClient());
  }, []);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    defaultAddress: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [emailSent, setEmailSent] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "password") {
      // Simple password strength indicator
      let strength = 0;
      if (value.length >= 6) strength += 1;
      if (value.length >= 10) strength += 1;
      if (/[A-Z]/.test(value)) strength += 1;
      if (/[0-9]/.test(value)) strength += 1;
      if (/[^A-Za-z0-9]/.test(value)) strength += 1;
      setPasswordStrength(strength);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError("Client not ready. Please refresh the page.");
      return;
    }
    setLoading(true);
    setError(null);

    // 1. Create user via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (!authData.user) {
      setError("Failed to create account. Please try again.");
      setLoading(false);
      return;
    }

    // Check if email confirmation is required (Supabase setting)
    if (authData.user.identities?.length === 0) {
      setError("An account with this email already exists.");
      setLoading(false);
      return;
    }

    // 2. Create profile — tries two approaches:
    //    a. Via the browser Supabase client (works when email confirmation is OFF)
    //    b. Falls back to the API with service-role (works when email confirmation is ON)
    let profileCreated = false;
    try {
      const { error: profileError } = await supabase.from("profiles").insert({
        id: authData.user.id,
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone || null,
        default_address: formData.defaultAddress || null,
      });

      if (!profileError) {
        profileCreated = true;
      } else {
        console.error("Client-side profile creation failed:", profileError);
      }
    } catch (err) {
      console.error("Client-side profile creation error:", err);
    }

    // Fallback: use API with service-role client (bypasses RLS)
    if (!profileCreated) {
      try {
        const res = await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: authData.user.id, // explicit user ID for service-role fallback
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone || null,
            defaultAddress: formData.defaultAddress || null,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          console.error("Service-role profile creation failed:", data.error);
        }
      } catch (err) {
        console.error("Service-role profile creation error:", err);
      }
    }

    // If email confirmation is required, Supabase won't return a session.
    // The user needs to check their email before they can log in.
    const hasSession = !!authData.session;
    if (!hasSession) {
      setEmailSent(true);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  // ── Email Confirmation Screen ──
  if (emailSent) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F2EDE1] py-16 px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl shadow-sm p-8 border border-[#E0D8C8]">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
              <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1
              className="text-2xl font-bold text-[#2C2C2C] mb-3"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Check Your Email
            </h1>
            <p className="text-[#8A9283] text-sm mb-2">
              We&apos;ve sent a confirmation email to{" "}
              <strong className="text-[#4A6B6D]">{formData.email}</strong>.
            </p>
            <p className="text-[#8A9283] text-sm mb-6">
              Click the link in the email to activate your account, then sign in.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={`https://mail.google.com`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-2.5 rounded-full bg-[#4A6B6D] text-white text-sm font-medium hover:bg-[#3A5557] transition-all"
              >
                Open Gmail
              </a>
              <Link
                href="/auth/login"
                className="inline-flex items-center px-6 py-2.5 rounded-full border border-[#4A6B6D] text-[#4A6B6D] text-sm font-medium hover:bg-[#4A6B6D] hover:text-white transition-all"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-[#F2EDE1] py-16 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm p-8 border border-[#E0D8C8]">
          <div className="text-center mb-8">
            <h1
              className="text-3xl font-bold text-[#2C2C2C] mb-2"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Join YBD
            </h1>
            <p className="text-[#8A9283] text-sm">Create your account to start shopping</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-[#5A5A4A] mb-1">
                Full Name *
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-[#E0D8C8] bg-white text-[#2C2C2C] placeholder-[#B8B2A3] focus:outline-none focus:ring-2 focus:ring-[#4A6B6D]/30 focus:border-[#4A6B6D] transition-all"
                placeholder="Qudus Olatunbosun"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#5A5A4A] mb-1">
                Email *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-[#E0D8C8] bg-white text-[#2C2C2C] placeholder-[#B8B2A3] focus:outline-none focus:ring-2 focus:ring-[#4A6B6D]/30 focus:border-[#4A6B6D] transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-[#5A5A4A] mb-1">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-[#E0D8C8] bg-white text-[#2C2C2C] placeholder-[#B8B2A3] focus:outline-none focus:ring-2 focus:ring-[#4A6B6D]/30 focus:border-[#4A6B6D] transition-all"
                placeholder="+234 800 000 0000"
              />
            </div>

            <div>
              <label htmlFor="defaultAddress" className="block text-sm font-medium text-[#5A5A4A] mb-1">
                Delivery Address
              </label>
              <textarea
                id="defaultAddress"
                name="defaultAddress"
                value={formData.defaultAddress}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-2.5 rounded-lg border border-[#E0D8C8] bg-white text-[#2C2C2C] placeholder-[#B8B2A3] focus:outline-none focus:ring-2 focus:ring-[#4A6B6D]/30 focus:border-[#4A6B6D] transition-all resize-none"
                placeholder="Your delivery address"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#5A5A4A] mb-1">
                Password *
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#E0D8C8] bg-white text-[#2C2C2C] placeholder-[#B8B2A3] focus:outline-none focus:ring-2 focus:ring-[#4A6B6D]/30 focus:border-[#4A6B6D] transition-all pr-10"
                  placeholder="Min. 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A9283] hover:text-[#4A6B6D] transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {/* Password strength indicator */}
              {formData.password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          passwordStrength >= level
                            ? passwordStrength <= 2
                              ? "bg-red-400"
                              : passwordStrength <= 3
                                ? "bg-amber-400"
                                : "bg-emerald-400"
                            : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-[#8A9283]">
                    {passwordStrength <= 2
                      ? "Weak — add uppercase, numbers & symbols"
                      : passwordStrength <= 3
                        ? "Good — adding symbols would make it strong"
                        : "Strong password!"}
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-full bg-[#4A6B6D] text-white font-medium hover:bg-[#3A5557] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="h-4 w-4" /> Create Account
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-[#8A9283] mt-6">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-[#4A6B6D] font-medium hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
