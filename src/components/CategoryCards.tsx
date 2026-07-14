"use client";

/**
 * Category shortcut cards for the homepage.
 * Must be a client component because it uses onClick and dispatches custom events.
 */
export function CategoryCards() {
  const categories = [
    {
      category: "cap",
      title: "Caps",
      description: "Classic & cadet styles",
      icon: "🧢",
      bgColor: "from-[#4A6B6D]/10 to-[#4A6B6D]/5",
      borderColor: "border-[#4A6B6D]/20",
      hoverStyle: "hover:border-[#4A6B6D]/40 hover:shadow-md",
    },
    {
      category: "tee",
      title: "Tees",
      description: "Bold graphic designs",
      icon: "👕",
      bgColor: "from-[#A6822E]/10 to-[#A6822E]/5",
      borderColor: "border-[#A6822E]/20",
      hoverStyle: "hover:border-[#A6822E]/40 hover:shadow-md",
    },
    {
      category: "hat",
      title: "Hats",
      description: "Trucker & bucket styles",
      icon: "🧢",
      bgColor: "from-[#5A7B7D]/10 to-[#5A7B7D]/5",
      borderColor: "border-[#5A7B7D]/20",
      hoverStyle: "hover:border-[#5A7B7D]/40 hover:shadow-md",
    },
  ];

  const handleClick = (category: string, title: string) => {
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
    window.dispatchEvent(new CustomEvent("category-filter", { detail: category }));
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
      {categories.map((cat) => (
        <button
          key={cat.title}
          aria-label={`Shop ${cat.title}`}
          onClick={() => handleClick(cat.category, cat.title)}
          className={`group relative overflow-hidden rounded-2xl bg-white border-2 ${cat.borderColor} ${cat.hoverStyle} p-6 sm:p-8 transition-all duration-300 text-left w-full cursor-pointer`}
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${cat.bgColor} opacity-50`} />
          <div className="relative">
            <span className="text-3xl sm:text-4xl mb-3 block">{cat.icon}</span>
            <h3
              className="text-xl font-bold text-[#2C2C2C] mb-1 group-hover:text-[#4A6B6D] transition-colors"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              {cat.title}
            </h3>
            <p className="text-sm text-[#8A9283]">{cat.description}</p>
            <span className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-[#4A6B6D] opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
              Shop {cat.title} <span className="text-lg">→</span>
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
