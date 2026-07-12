"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { LogIn, Eye, EyeOff } from "lucide-react";

/** Inner component that uses useSearchParams — wrapped in Suspense below */
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/";
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push(redirect);
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
              Welcome Back
            </h1>
            <p className="text-[#8A9283] text-sm">Sign in to your YBD account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#5A5A4A] mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-[#E0D8C8] bg-white text-[#2C2C2C] placeholder-[#B8B2A3] focus:outline-none focus:ring-2 focus:ring-[#4A6B6D]/30 focus:border-[#4A6B6D] transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#5A5A4A] mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#E0D8C8] bg-white text-[#2C2C2C] placeholder-[#B8B2A3] focus:outline-none focus:ring-2 focus:ring-[#4A6B6D]/30 focus:border-[#4A6B6D] transition-all pr-10"
                  placeholder="Your password"
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
                  <LogIn className="h-4 w-4" /> Sign In
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-[#8A9283] mt-6">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/signup"
              className="text-[#4A6B6D] font-medium hover:underline"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

/** Wrapper with Suspense boundary for useSearchParams */
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center bg-[#F2EDE1]">
        <div className="animate-pulse text-[#8A9283]">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
