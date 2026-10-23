import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const TONES: Record<string, string> = {
  /* station */
  available: "border-lime/25 bg-lime/10 text-lime",
  occupied: "border-violet/30 bg-violet/15 text-violet-soft",
  reserved: "border-cyan/25 bg-cyan/10 text-cyan",
  maintenance: "border-amber/25 bg-amber/10 text-amber",
  /* bookings */
  upcoming: "border-cyan/25 bg-cyan/10 text-cyan",
  active: "border-violet/30 bg-violet/15 text-violet-soft",
  completed: "border-white/10 bg-white/[0.05] text-white/60",
  cancelled: "border-danger/25 bg-danger/10 text-danger",
  /* payments */
  paid: "border-lime/25 bg-lime/10 text-lime",
  pending: "border-amber/25 bg-amber/10 text-amber",
  refunded: "border-white/10 bg-white/[0.05] text-white/60",
  failed: "border-danger/25 bg-danger/10 text-danger",
  /* games */
  retired: "border-white/10 bg-white/[0.05] text-white/45",
  /* members */
  inactive: "border-white/10 bg-white/[0.05] text-white/50",
  banned: "border-danger/25 bg-danger/10 text-danger",
  /* tournaments */
  draft: "border-white/10 bg-white/[0.05] text-white/55",
  open: "border-cyan/25 bg-cyan/10 text-cyan",
  live: "border-danger/30 bg-danger/10 text-danger",
  /* tiers */
  Bronze: "border-amber-700/30 bg-amber-700/10 text-amber-500",
  Silver: "border-slate-400/25 bg-slate-400/10 text-slate-300",
  Gold: "border-amber/30 bg-amber/10 text-amber",
  Platinum: "border-cyan/30 bg-cyan/10 text-cyan",
  /* roles */
  owner: "border-violet/30 bg-violet/15 text-violet-soft",
  manager: "border-cyan/25 bg-cyan/10 text-cyan",
  staff: "border-white/10 bg-white/[0.05] text-white/60",
};

export function Badge({
  children,
  tone,
  dot,
  className,
}: {
  children: ReactNode;
  tone?: string;
  dot?: boolean;
  className?: string;
}) {
  const key = tone ?? String(children);
  return (
    <span className={cn("badge", TONES[key] ?? "border-white/10 bg-white/[0.05] text-white/60", className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
