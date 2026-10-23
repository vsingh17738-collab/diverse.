export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-white/[0.05] p-4">
        <div className="skeleton h-4 w-32" />
      </div>
      <div className="divide-y divide-white/[0.04]">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4" style={{ opacity: 1 - i * 0.09 }}>
            <div className="skeleton h-9 w-9 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3 w-1/3" />
              <div className="skeleton h-2.5 w-1/5" />
            </div>
            <div className="skeleton hidden h-3 w-20 sm:block" />
            <div className="skeleton h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardsSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card space-y-3 p-5" style={{ opacity: 1 - i * 0.06 }}>
          <div className="flex items-center justify-between">
            <div className="skeleton h-10 w-10 rounded-xl" />
            <div className="skeleton h-5 w-16 rounded-full" />
          </div>
          <div className="skeleton h-4 w-2/3" />
          <div className="skeleton h-3 w-1/2" />
          <div className="skeleton h-16 w-full" />
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="card p-6">
        <div className="skeleton h-7 w-56" />
        <div className="mt-3 skeleton h-3 w-80" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card space-y-3 p-5" style={{ opacity: 1 - i * 0.08 }}>
            <div className="flex justify-between">
              <div className="skeleton h-3 w-20" />
              <div className="skeleton h-9 w-9 rounded-xl" />
            </div>
            <div className="skeleton h-7 w-28" />
            <div className="skeleton h-3 w-32" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="card p-5 xl:col-span-2">
          <div className="skeleton h-4 w-40" />
          <div className="skeleton mt-4 h-[190px] w-full" />
        </div>
        <div className="card space-y-4 p-5">
          <div className="skeleton h-4 w-32" />
          <div className="skeleton mx-auto h-[148px] w-[148px] rounded-full" />
          <div className="skeleton h-3 w-full" />
        </div>
      </div>
    </div>
  );
}
