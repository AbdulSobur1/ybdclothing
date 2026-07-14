"use client";

import { useState } from "react";
import Link from "next/link";
import { config } from "@/lib/config";
import { Mail, Check, Loader2 } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<"idle" | "loading" | "success">("idle");

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterStatus("loading");
    // Placeholder: in production, integrate with an email service
    await new Promise((r) => setTimeout(r, 800));
    setNewsletterStatus("success");
    setNewsletterEmail("");
    setTimeout(() => setNewsletterStatus("idle"), 3000);
  };

  return (
    <footer className="bg-[#2C3E3F] text-[#D4CFC2] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <h3
              className="text-xl font-bold text-[#F2EDE1] mb-3"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              YBD Clothing
            </h3>
            <p className="text-sm text-[#B8B2A3] leading-relaxed max-w-xs">
              YBD is a premium clothing brand dedicated to creating timeless designs that reflect confidence, purpose, and individuality.
            </p>
          </div>

          {/* Newsletter */}
          <div className="md:col-span-1">
            <h4 className="text-sm font-semibold text-[#F2EDE1] uppercase tracking-wider mb-3">
              Stay Updated
            </h4>
            <p className="text-xs text-[#B8B2A3] mb-3">
              Get notified about new drops and exclusive offers.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-xs placeholder-[#8A9283] focus:outline-none focus:border-[#A6822E] transition-all"
              />
              <button
                type="submit"
                disabled={newsletterStatus === "loading" || newsletterStatus === "success"}
                className="px-3 py-2 rounded-lg bg-[#A6822E] text-white text-xs font-medium hover:bg-[#8E6E1F] transition-all disabled:opacity-50"
              >
                {newsletterStatus === "loading" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : newsletterStatus === "success" ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  "Subscribe"
                )}
              </button>
            </form>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-1">
            <h4 className="text-sm font-semibold text-[#F2EDE1] uppercase tracking-wider mb-3">
              Links
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-[#B8B2A3] hover:text-[#D4CFC2] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/shop" className="text-sm text-[#B8B2A3] hover:text-[#D4CFC2] transition-colors">
                  Shop
                </Link>
              </li>
              <li>
                <Link href="/orders" className="text-sm text-[#B8B2A3] hover:text-[#D4CFC2] transition-colors">
                  My Orders
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-[#B8B2A3] hover:text-[#D4CFC2] transition-colors">
                  Terms & Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div className="md:col-span-1">
            <h4 className="text-sm font-semibold text-[#F2EDE1] uppercase tracking-wider mb-3">
              Connect
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href={`tel:${config.phone.replace(/\s/g, "")}`}
                  className="inline-flex items-center gap-2 text-sm text-[#B8B2A3] hover:text-[#D4CFC2] transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
                  {config.phone}
                </a>
              </li>
              <li>
                <a
                  href={`https://wa.me/${config.whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-[#B8B2A3] hover:text-[#D4CFC2] transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </a>
              </li>
              <li>
                <a
                  href="mailto:qudusolashile16@gmail.com"
                  className="inline-flex items-center gap-2 text-sm text-[#B8B2A3] hover:text-[#D4CFC2] transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  Email
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/Ybd___clothing_/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-[#B8B2A3] hover:text-[#D4CFC2] transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href="https://www.tiktok.com/@ybd_clothing_"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-[#B8B2A3] hover:text-[#D4CFC2] transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
                  TikTok
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#3D5253] mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#8A9283]">
            &copy; {currentYear} YBD Clothing. All rights reserved.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
            <p className="text-xs text-[#8A9283]">
              Coded by Larry &amp; programmed by Sobur
            </p>
            <span className="hidden sm:inline text-[#3D5253]">|</span>
            <p className="text-xs text-[#8A9283]">
              Made in Nigeria 🇳🇬
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
