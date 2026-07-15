"use client";

import Link from "next/link";
import { CircleDot, Shirt, Diamond } from "lucide-react";

const categoryData = [
  {
    category: "cap",
    title: "Caps",
    description: "Classic & cadet styles",
    icon: CircleDot,
    color: "#4A6B6D",
    bgColor: "from-[#4A6B6D]/10 to-[#4A6B6D]/5",
    borderColor: "border-[#4A6B6D]/20",
    hoverStyle: "hover:border-[#4A6B6D]/40 hover:shadow-md",
  },
  {
    category: "tee",
    title: "Tees",
    description: "Bold graphic designs",
    icon: Shirt,
    color: "#A6822E",
    bgColor: "from-[#A6822E]/10 to-[#A6822E]/5",
    borderColor: "border-[#A6822E]/20",
    hoverStyle: "hover:border-[#A6822E]/40 hover:shadow-md",
  },
  {
    category: "jersey",
    title: "Jerseys",
    description: "Premium sport & street styles",
    icon: Diamond,
    color: "#5A7B7D",
    bgColor: "from-[#5A7B7D]/10 to-[#5A7B7D]/5",
    borderColor: "border-[#5A7B7D]/20",
    hoverStyle: "hover:border-[#5A7B7D]/40 hover:shadow-md",
  },
];

/**
 * Category shortcut cards for the homepage.
 * Links to the /shop page with a category filter parameter.
 */
export function CategoryCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
      {categoryData.map((cat) => {
        const Icon = cat.icon;
        return (
          <Link
            key={cat.title}
            href={`/shop?category=${cat.category}`}
            aria-label={`Shop ${cat.title}`}
            className={`group relative overflow-hidden rounded-xl bg-white border-2 ${cat.borderColor} ${cat.hoverStyle} p-5 sm:p-6 transition-all duration-300 block`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${cat.bgColor} opacity-50`} />
            <div className="relative flex items-center gap-4">
              {/* Icon circle */}
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${cat.color}15` }}
              >
                <Icon className="h-5 w-5" style={{ color: cat.color }} />
              </div>
              {/* Text */}
              <div className="min-w-0">
                <h3
                  className="text-base font-bold text-[#2C2C2C] group-hover:text-[#4A6B6D] transition-colors"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  {cat.title}
                </h3>
                <p className="text-xs text-[#8A9283]">{cat.description}</p>
              </div>
              {/* Arrow */}
              <span className="ml-auto text-sm font-medium text-[#4A6B6D] opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0">
                →
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
