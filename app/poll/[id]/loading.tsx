export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto animate-pulse">
      <div className="mb-6 bg-white/5 border border-white/10 rounded-lg p-4">
        <div className="h-4 bg-white/10 rounded w-1/4 mb-2"></div>
        <div className="h-10 bg-white/10 rounded"></div>
      </div>
      <div className="h-8 bg-white/10 rounded-lg w-3/4 mb-4"></div>
      <div className="h-4 bg-white/10 rounded w-1/4 mb-8"></div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 bg-white/10 rounded-lg"></div>
        ))}
      </div>
    </div>
  );
}
