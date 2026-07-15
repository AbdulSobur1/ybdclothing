"use client";

import { usePathname } from "next/navigation";
import { config } from "@/lib/config";
import { MessageCircle } from "lucide-react";

/**
 * Floating WhatsApp button for general support/questions.
 * Hidden on admin routes.
 */
export function WhatsAppButton() {
  const pathname = usePathname();

  // Don't render on admin routes
  if (pathname.startsWith("/admin")) {
    return null;
  }

  const whatsappUrl = `https://wa.me/${config.whatsappNumber}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-[#25D366] text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
      title="Chat on WhatsApp"
    >
      <MessageCircle className="h-5 w-5" />
      <span className="text-sm font-medium hidden sm:inline">Chat with us</span>
    </a>
  );
}
