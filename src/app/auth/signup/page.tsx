"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { UserPlus, Eye, EyeOff } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
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

    // Check if email confirmation is required
    if (authData.user.identities?.length === 0) {
      setError("An account with this email already exists.");
      setLoading(false);
      return;
    }

    // 2. Create profile via server API endpoint
    try {
      const profileRes = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone || null,
          defaultAddress: formData.defaultAddress || null,
        }),
      });

      if (!profileRes.ok) {
        const profileData = await profileRes.json();
        console.error("Profile creation error:", profileData.error);
        // Auth user was created, so we can still proceed
      }
    } catch (err) {
      console.error("Profile creation error:", err);
      // Non-blocking — auth user exists
    }

    router.push("/");
    router.refresh();
  };

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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A9283] hover:text-[#4A6B6D]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
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
