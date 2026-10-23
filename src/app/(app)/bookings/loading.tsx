import { TableSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div>
      <div className="card mb-6 h-[108px] animate-pulse" />
      <div className="mb-4 flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-9 w-24" />
        ))}
      </div>
      <TableSkeleton rows={8} />
    </div>
  );
}
