import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";

export const metadata: Metadata = {
  title: "YBD Clothing — Nigerian Streetwear",
  description:
    "Premium caps, tees, and hats for those who dare to stand out. Bold designs, quality craftsmanship — made in Nigeria.",
  keywords: ["streetwear", "Nigerian fashion", "caps", "tees", "YBD Clothing"],
  icons: {
    icon: "/logo-icon.svg",
    apple: "/logo-icon.svg",
  },
  // OpenGraph image — place a 1200x630 PNG at /public/og-image.png for social sharing
  // openGraph: { images: [{ url: "/og-image.png", width: 1200, height: 630 }] },
  openGraph: {
    title: "YBD Clothing — Nigerian Streetwear",
    description: "Premium streetwear for those who dare to stand out.",
    type: "website",
    locale: "en_NG",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased">
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
        <WhatsAppButton />
      </body>
    </html>
  );
}
