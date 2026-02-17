export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto animate-pulse">
      {/* Share bar skeleton */}
      <div className="glass-card p-4 mb-8">
        <div className="h-3 bg-white/[0.06] rounded w-24 mb-3" />
        <div className="flex gap-2">
          <div className="flex-1 h-10 bg-white/[0.04] rounded-xl" />
          <div className="w-20 h-10 bg-white/[0.06] rounded-xl" />
        </div>
      </div>

      {/* Title skeleton */}
      <div className="mb-8">
        <div className="h-9 bg-white/[0.06] rounded-xl w-3/4 mb-3" />
        <div className="h-5 bg-white/[0.04] rounded-lg w-32" />
      </div>

      {/* Options skeleton */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="glass-card px-5 py-4"
            style={{ opacity: 1 - i * 0.15 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-white/[0.06]" />
              <div className="h-4 bg-white/[0.06] rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
