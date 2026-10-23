export default function Loading() {
  return (
    <div className="space-y-5">
      <div className="card h-[108px] animate-pulse" />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card h-56 animate-pulse" />
          ))}
        </div>
        <div className="space-y-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card h-44 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
