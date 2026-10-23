"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarPlus, Radio } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Segmented } from "@/components/ui/toolbar";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, currency, formatTime } from "@/lib/utils";
import type { Booking } from "@/lib/types";

type Filter = "all" | "live" | "upcoming";

export function TodaySchedule({ bookings }: { bookings: Booking[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [now, setNow] = useState(0);

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const counts = useMemo(
    () => ({
      all: bookings.length,
      live: bookings.filter((b) => b.status === "active").length,
      upcoming: bookings.filter((b) => b.status === "upcoming").length,
    }),
    [bookings],
  );

  const filtered = bookings.filter((b) =>
    filter === "all" ? true : filter === "live" ? b.status === "active" : b.status === "upcoming",
  );

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All", count: counts.all },
            { value: "live", label: "Live", count: counts.live },
            { value: "upcoming", label: "Upcoming", count: counts.upcoming },
          ]}
        />
        <Link
          href="/bookings"
          className="text-[11px] font-semibold text-violet-soft hover:text-violet"
        >
          View all
        </Link>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          compact
          icon={CalendarPlus}
          title="Nothing scheduled"
          description="No sessions match this filter. Create a booking to fill the floor."
          action={
            <Link href="/bookings?new=1" className="btn-secondary btn-sm">
              New booking
            </Link>
          }
        />
      ) : (
        <ul className="max-h-[330px] space-y-2 overflow-y-auto pr-1">
          {filtered.map((b, i) => {
            const isLive = b.status === "active";
            const start = new Date(b.start_time).getTime();
            const end = new Date(b.end_time).getTime();
            const progress = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
            return (
              <li
                key={b.id}
                className={cn(
                  "group relative flex items-start gap-3 rounded-xl border p-2.5 transition-colors",
                  isLive
                    ? "border-violet/25 bg-violet/[0.06]"
                    : "border-white/[0.05] bg-white/[0.015] hover:border-white/10 hover:bg-white/[0.03]",
                )}
                style={{ animation: `fade-up 0.4s ${i * 0.04}s both` }}
              >
                <div className="w-11 shrink-0 pt-0.5 text-right">
                  <p className="font-mono text-[11px] font-semibold text-white/80">
                    {formatTime(b.start_time)}
                  </p>
                  <p className="font-mono text-[10px] text-white/30">{formatTime(b.end_time)}</p>
                </div>
                <span
                  className={cn(
                    "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                    isLive ? "animate-pulse-dot bg-violet" : "bg-white/20",
                  )}
                />
                <Avatar name={b.member_name ?? "?"} color={b.member_color} size="xs" className="mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[12.5px] font-semibold text-white/90">
                      {b.member_name}
                    </p>
                    {isLive && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-violet-soft">
                        <Radio className="h-2.5 w-2.5" /> live
                      </span>
                    )}
                  </div>
                  <p className="truncate text-[11px] text-muted">
                    {b.station_name} · {b.game_title ?? "Open play"} · {b.players}p
                  </p>
                  {isLive && (
                    <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/[0.07]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet to-cyan transition-all duration-1000"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge tone={b.status} dot={isLive}>
                    {b.status}
                  </Badge>
                  <span className="text-[11px] font-semibold text-white/50">
                    {currency(b.total_amount)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
