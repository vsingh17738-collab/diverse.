import Link from "next/link";
import { Ghost, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-violet/15 blur-[100px]" />
      <div className="relative">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
          <Ghost className="h-7 w-7 text-violet-soft" />
        </div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-soft">
          404 · Game over
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
          This level doesn&apos;t exist
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-white/40">
          The page you were looking for has respawned somewhere else.
        </p>
        <Link href="/dashboard" className="btn-primary mt-6">
          <Home className="h-4 w-4" /> Back to dashboard
        </Link>
      </div>
    </div>
  );
}
