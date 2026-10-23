import { TableSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div>
      <div className="card mb-6 h-[108px] animate-pulse" />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card h-[68px] animate-pulse" />
        ))}
      </div>
      <TableSkeleton rows={9} />
    </div>
  );
}
