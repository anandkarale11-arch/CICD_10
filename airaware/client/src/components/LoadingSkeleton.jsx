export default function LoadingSkeleton() {
  return (
    <div className="w-full space-y-4 animate-pulse">
      {/* City header */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="skeleton h-6 w-48 rounded" />
            <div className="skeleton h-4 w-32 rounded" />
          </div>
          <div className="skeleton h-9 w-24 rounded-xl" />
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Gauge */}
        <div className="glass-card p-6">
          <div className="skeleton h-48 w-full rounded-xl" />
        </div>

        {/* Pollutants */}
        <div className="glass-card p-6 lg:col-span-2">
          <div className="skeleton h-4 w-32 rounded mb-4" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="skeleton h-4 w-16 rounded" />
                <div className="skeleton h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="glass-card p-6">
        <div className="skeleton h-64 w-full rounded-xl" />
      </div>
    </div>
  );
}
