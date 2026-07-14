"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Mail, ArrowLeft, Check, Loader2 } from "lucide-react";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/profile`,
    });

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F2EDE1] py-16 px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl shadow-sm p-8 border border-[#E0D8C8]">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
              <Check className="h-8 w-8 text-emerald-600" />
            </div>
            <h1
              className="text-2xl font-bold text-[#2C2C2C] mb-3"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Check Your Email
            </h1>
            <p className="text-[#8A9283] text-sm mb-6">
              We&apos;ve sent a password reset link to <strong className="text-[#4A6B6D]">{email}</strong>.
              Click the link in the email to reset your password.
            </p>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 text-sm text-[#4A6B6D] font-medium hover:underline"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Sign In
            </Link>
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
              Reset Password
            </h1>
            <p className="text-[#8A9283] text-sm">
              Enter your email and we&apos;ll send you a reset link.
            </p>
          </div>

          <form onSubmit={handleReset} className="space-y-5">
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

            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-full bg-[#4A6B6D] text-white font-medium hover:bg-[#3A5557] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Mail className="h-4 w-4" /> Send Reset Link
                </>
              )}
            </button>
          </form>

          <p className="text-center mt-6">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1 text-sm text-[#4A6B6D] font-medium hover:underline"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
