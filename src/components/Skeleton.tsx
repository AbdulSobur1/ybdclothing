/**
 * Skeleton loading placeholders.
 *
 * Drop these in while data is loading to show users the page structure
 * instead of a generic spinner. Each variant matches a common layout
 * pattern used across the app.
 */

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-white/80 rounded-xl border border-[#E0D8C8] p-6 ${className}`}>
      <SkeletonLine className="h-4 w-1/3 mb-4" />
      <SkeletonLine className="h-3 w-full mb-2" />
      <SkeletonLine className="h-3 w-3/4 mb-4" />
      <SkeletonLine className="h-8 w-24 rounded-lg" />
    </div>
  );
}

export function SkeletonProductGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-[#16213e] rounded-xl border border-white/5 p-5">
          <div className="w-10 h-10 rounded-lg bg-white/5 animate-pulse mb-3" />
          <SkeletonLine className="h-4 w-2/3 bg-white/10 mb-2" />
          <SkeletonLine className="h-3 w-1/3 bg-white/10 mb-3" />
          <SkeletonLine className="h-5 w-1/4 bg-white/10 mb-3" />
          <div className="flex gap-2">
            <SkeletonLine className="h-5 w-16 rounded bg-white/10" />
            <SkeletonLine className="h-5 w-20 rounded bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-[#16213e] rounded-xl border border-white/5 overflow-hidden">
      <div className="border-b border-white/5 p-4">
        <div className="flex gap-8">
          <SkeletonLine className="h-3 w-16 bg-white/10" />
          <SkeletonLine className="h-3 w-24 bg-white/10" />
          <SkeletonLine className="h-3 w-16 bg-white/10" />
          <SkeletonLine className="h-3 w-10 bg-white/10" />
          <SkeletonLine className="h-3 w-16 bg-white/10" />
          <SkeletonLine className="h-3 w-20 bg-white/10" />
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-b border-white/5 p-4">
          <div className="flex gap-8 items-center">
            <SkeletonLine className="h-4 w-16 bg-white/10" />
            <SkeletonLine className="h-4 w-32 bg-white/10" />
            <SkeletonLine className="h-5 w-20 rounded-full bg-white/10" />
            <SkeletonLine className="h-4 w-8 bg-white/10" />
            <SkeletonLine className="h-4 w-16 bg-white/10" />
            <SkeletonLine className="h-4 w-20 bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonStatsGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-[#16213e] rounded-xl p-5 border border-white/5">
          <div className="w-10 h-10 rounded-lg bg-white/5 animate-pulse mb-3" />
          <SkeletonLine className="h-7 w-16 bg-white/10 mb-1" />
          <SkeletonLine className="h-3 w-20 bg-white/10" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonCheckout() {
  return (
    <div className="flex-1 bg-[#F2EDE1]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress steps skeleton */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center">
              <SkeletonLine className="h-8 w-8 rounded-full" />
              {i < 3 && <SkeletonLine className="h-0.5 w-8 sm:w-12 mx-1" />}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <div className="lg:col-span-2">
            <SkeletonCard />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="flex-1 bg-[#F2EDE1] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-5 mb-8">
          <SkeletonLine className="h-16 w-16 rounded-full" />
          <div>
            <SkeletonLine className="h-7 w-48 mb-2" />
            <SkeletonLine className="h-4 w-32" />
          </div>
        </div>
        {Array.from({ length: 2 }).map((_, i) => (
          <SkeletonCard key={i} className="mb-6" />
        ))}
      </div>
    </div>
  );
}

export function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-[#D4CFC2]/40 ${className}`}
      aria-hidden="true"
    />
  );
}
