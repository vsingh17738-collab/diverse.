"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw, TriangleAlert } from "lucide-react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-danger/25 bg-danger/10">
        <TriangleAlert className="h-6 w-6 text-danger" />
      </div>
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-danger">
        Something crashed
      </p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">
        That screen didn&apos;t load
      </h1>
      <p className="mt-2 max-w-md text-sm text-white/40">
        {error.message || "An unexpected error occurred while loading this view."}
      </p>
      <div className="mt-6 flex items-center gap-2">
        <button onClick={reset} className="btn-primary">
          <RotateCcw className="h-4 w-4" /> Try again
        </button>
        <Link href="/dashboard" className="btn-secondary">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
