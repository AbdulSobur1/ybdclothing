import Link from "next/link";
import { config } from "@/lib/config";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#2C3E3F] text-[#D4CFC2] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h3
              className="text-xl font-bold text-[#F2EDE1] mb-3"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              YBD Clothing
            </h3>
            <p className="text-sm text-[#B8B2A3] leading-relaxed max-w-xs">
              Nigerian streetwear for those who dare to stand out. Premium quality, bold designs.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-[#F2EDE1] uppercase tracking-wider mb-3">
              Links
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-[#B8B2A3] hover:text-[#D4CFC2] transition-colors">
                  Shop All
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

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-[#F2EDE1] uppercase tracking-wider mb-3">
              Contact
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href={`https://wa.me/${config.whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#B8B2A3] hover:text-[#D4CFC2] transition-colors"
                >
                  WhatsApp Support
                </a>
              </li>
              <li className="text-sm text-[#B8B2A3]">
                Bank: {config.bank.name}
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
