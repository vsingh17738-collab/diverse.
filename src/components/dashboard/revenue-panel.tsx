"use client";

import { useState } from "react";
import { AreaChart } from "@/components/ui/charts";
import { currency } from "@/lib/utils";
import { Segmented } from "@/components/ui/toolbar";
import type { RevenuePoint } from "@/lib/queries";

export function RevenuePanel({ data }: { data: RevenuePoint[] }) {
  const [metric, setMetric] = useState<"revenue" | "bookings">("revenue");
  const total = data.reduce((s, d) => s + d.revenue, 0);
  const sessions = data.reduce((s, d) => s + d.bookings, 0);
  const best = data.reduce((a, b) => (b.revenue > a.revenue ? b : a), data[0]);

  const series = data.map((d) => ({
    label: d.label,
    value: metric === "revenue" ? d.revenue : d.bookings,
  }));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white">
              {currency(metric === "revenue" ? total : sessions, {
                compact: metric === "revenue",
              })}
            </span>
            <span className="rounded-md bg-lime/10 px-1.5 py-0.5 text-[11px] font-semibold text-lime">
              +12.4%
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-muted">
            {metric === "revenue" ? "Collected" : "Sessions processed"} · last 14 days
            {best && ` · best day ${best.label}`}
          </p>
        </div>
        <Segmented
          value={metric}
          onChange={setMetric}
          options={[
            { value: "revenue", label: "Revenue" },
            { value: "bookings", label: "Bookings" },
          ]}
        />
      </div>
      <AreaChart
        data={series}
        id={metric}
        color={metric === "revenue" ? "#8b5cf6" : "#22d3ee"}
        valueFormatter={(v) => (metric === "revenue" ? currency(v) : `${v} sessions`)}
      />
    </div>
  );
}
