import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sparkline } from "./charts";

export function StatCard({
  label,
  value,
  delta,
  deltaLabel,
  icon: Icon,
  accent = "#8b5cf6",
  spark,
  footer,
  index = 0,
}: {
  label: string;
  value: string;
  delta?: number;
  deltaLabel?: string;
  icon: ComponentType<LucideProps>;
  accent?: string;
  spark?: number[];
  footer?: string;
  index?: number;
}) {
  const positive = (delta ?? 0) >= 0;
  return (
    <div
      className="card card-hover group relative overflow-hidden p-4 animate-[fade-up_0.5s_cubic-bezier(0.22,1,0.36,1)_both] sm:p-5"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full opacity-[0.13] blur-2xl transition-opacity group-hover:opacity-25"
        style={{ background: accent }}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-[27px]">
            {value}
          </p>
        </div>
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.07]"
          style={{ background: `${accent}14`, color: accent }}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          {delta !== undefined && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
                positive ? "bg-lime/10 text-lime" : "bg-danger/10 text-danger",
              )}
            >
              {positive ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {Math.abs(delta).toFixed(1)}%
            </span>
          )}
          <p className="mt-1.5 truncate text-[11px] text-white/35">
            {deltaLabel ?? footer}
          </p>
        </div>
        {spark && <Sparkline values={spark} color={accent} />}
      </div>
    </div>
  );
}
