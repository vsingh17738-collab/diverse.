import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CalendarClock,
  CircleDollarSign,
  Clock3,
  Gamepad2,
  MonitorPlay,
  Plus,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/queries";
import { StatCard } from "@/components/ui/stat-card";
import { SectionCard } from "@/components/ui/page-header";
import { RevenuePanel } from "@/components/dashboard/revenue-panel";
import { TodaySchedule } from "@/components/dashboard/today-schedule";
import { BarChart, Donut } from "@/components/ui/charts";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { currency, formatDate, formatTime, number, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function delta(today: number, yesterday: number) {
  if (!yesterday) return today > 0 ? 100 : 0;
  return ((today - yesterday) / yesterday) * 100;
}

export default async function DashboardPage() {
  const [user, data] = await Promise.all([getCurrentUser(), Promise.resolve(getDashboardData())]);
  const { stats, revenue, peakHours, kindMix, todayBookings, activity, topGames, upcoming } = data;

  const memberSpark = data.memberGrowth.map((m) => m.members);
  const peakHighlight = Math.max(...peakHours.map((p) => p.sessions));

  return (
    <div className="space-y-5">
      {/* hero */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-br from-[#12101f] via-[#0c0c16] to-[#0a0f14] p-5 sm:p-6">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-50" />
        <div className="pointer-events-none absolute -right-10 -top-24 h-64 w-64 rounded-full bg-violet/[0.18] blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-24 right-1/3 h-52 w-52 rounded-full bg-cyan/[0.10] blur-[80px]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-lime/25 bg-lime/[0.08] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-lime">
                <span className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-lime" />
                Zone live
              </span>
              <span className="text-[11px] text-white/35">
                {formatDate(new Date().toISOString(), {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <h1 className="text-[26px] font-bold leading-tight tracking-tight text-white sm:text-3xl">
              {greeting()}, {user?.name.split(" ")[0] ?? "there"} 👾
            </h1>
            <p className="mt-1.5 max-w-xl text-sm text-white/45">
              {stats.activeSessions} sessions running · {stats.occupiedStations} stations in use ·{" "}
              {stats.bookingsToday} bookings booked today. The floor is busy — here&apos;s the pulse.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/bookings?new=1" className="btn-primary">
              <Plus className="h-4 w-4" /> New booking
            </Link>
            <Link href="/tournaments" className="btn-secondary">
              <Trophy className="h-4 w-4" /> Tournaments
            </Link>
          </div>
        </div>
      </div>

      {/* kpis */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          index={0}
          label="Revenue today"
          value={currency(stats.revenueToday)}
          delta={delta(stats.revenueToday, stats.revenueYesterday)}
          deltaLabel={`vs ${currency(stats.revenueYesterday)} yesterday`}
          icon={CircleDollarSign}
          accent="#a3e635"
          spark={revenue.slice(-8).map((r) => r.revenue)}
        />
        <StatCard
          index={1}
          label="Live sessions"
          value={String(stats.activeSessions)}
          deltaLabel={`${stats.occupiedStations} of ${stats.totalStations} stations busy · ${Math.round(stats.utilization)}% util`}
          icon={Zap}
          accent="#8b5cf6"
          spark={peakHours.slice(-8).map((p) => p.sessions)}
        />
        <StatCard
          index={2}
          label="Bookings today"
          value={String(stats.bookingsToday)}
          delta={delta(stats.bookingsToday, stats.bookingsYesterday)}
          deltaLabel={`${stats.bookingsYesterday} yesterday · avg ${stats.avgSessionMinutes}m session`}
          icon={CalendarClock}
          accent="#22d3ee"
          spark={revenue.slice(-8).map((r) => r.bookings)}
        />
        <StatCard
          index={3}
          label="Members"
          value={number(stats.totalMembers)}
          deltaLabel={`+${stats.newMembersMonth} joined in last 30 days`}
          icon={Users}
          accent="#f472b6"
          spark={memberSpark}
        />
      </div>

      {/* revenue + mix */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <SectionCard
          className="xl:col-span-2"
          title="Revenue performance"
          subtitle="Payments captured across sessions, tournaments and retail"
          action={
            <Link
              href="/transactions"
              className="flex items-center gap-1 text-[11px] font-semibold text-white/40 hover:text-white"
            >
              Ledger <ArrowRight className="h-3 w-3" />
            </Link>
          }
        >
          <RevenuePanel data={revenue} />
        </SectionCard>

        <div className="space-y-4">
          <SectionCard title="Station mix" subtitle="Capacity by hardware type">
            <Donut
              segments={kindMix.map((k) => ({
                label: k.kind,
                value: k.count,
                color: k.color,
              }))}
              centerValue={String(stats.totalStations)}
              centerLabel="stations"
            />
          </SectionCard>
          <SectionCard title="Utilization" subtitle="Busy vs available right now" padded>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold tracking-tight text-white">
                  {Math.round(stats.utilization)}%
                </p>
                <p className="text-[11px] text-muted">floor utilization</p>
              </div>
              <Badge tone={stats.utilization > 60 ? "available" : "pending"} dot>
                {stats.utilization > 60 ? "Peak load" : "Filling up"}
              </Badge>
            </div>
            <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet via-[#7c3aed] to-cyan transition-all duration-700"
                style={{ width: `${Math.min(100, stats.utilization)}%` }}
              />
            </div>
            <div className="mt-3 flex justify-between text-[11px] text-white/35">
              <span>{stats.occupiedStations} busy</span>
              <span>{stats.totalStations - stats.occupiedStations} open</span>
            </div>
          </SectionCard>
        </div>
      </div>

      {/* schedule + peak */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <SectionCard
          className="xl:col-span-2"
          title="Today's schedule"
          subtitle="Live progress updates every 30 seconds"
          action={
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-lime">
              <span className="h-1.5 w-1.5 rounded-full bg-lime" /> {stats.activeSessions} live
            </span>
          }
        >
          <TodaySchedule bookings={todayBookings} />
        </SectionCard>

        <SectionCard title="Peak hours" subtitle="Sessions started by hour">
          <BarChart
            data={peakHours.map((p) => ({
              label: String(p.hour % 12 === 0 ? 12 : p.hour % 12),
              value: p.sessions,
              highlight: p.sessions === peakHighlight,
            }))}
            height={168}
            suffix="sessions"
          />
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5">
            <Clock3 className="h-3.5 w-3.5 shrink-0 text-amber" />
            <p className="text-[11px] leading-snug text-white/45">
              Busiest window is <span className="font-semibold text-white/80">6–10pm</span>. Staff up
              and keep VR pods clear.
            </p>
          </div>
        </SectionCard>
      </div>

      {/* activity + top games + tournaments */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <SectionCard
          title="Live activity"
          subtitle="Latest movements on the floor"
          action={<Activity className="h-4 w-4 text-white/20" />}
        >
          <ul className="space-y-3.5">
            {activity.map((item, i) => (
              <li key={item.id} className="flex gap-3" style={{ animation: `fade-in 0.4s ${i * 0.05}s both` }}>
                <div className="flex flex-col items-center">
                  <span
                    className="mt-1 h-2 w-2 shrink-0 rounded-full ring-4 ring-white/[0.03]"
                    style={{ background: item.color }}
                  />
                  {i < activity.length - 1 && <span className="mt-1 w-px flex-1 bg-white/[0.07]" />}
                </div>
                <div className="min-w-0 flex-1 pb-1">
                  <p className="truncate text-[12.5px] font-medium text-white/85">{item.title}</p>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-white/35">
                    <span className="truncate">{item.detail}</span>
                    <span>·</span>
                    <span className="whitespace-nowrap">{timeAgo(item.at)}</span>
                  </div>
                </div>
                {item.amount !== undefined && (
                  <span className="shrink-0 text-[12px] font-semibold text-lime">
                    +{currency(item.amount)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard
          title="Most played"
          subtitle="Sessions in the last 30 days"
          action={
            <Link href="/games" className="text-[11px] font-semibold text-white/40 hover:text-white">
              Library
            </Link>
          }
        >
          <ul className="space-y-3">
            {topGames.map((g, i) => (
              <li key={g.title} className="group">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="w-4 text-[10px] font-bold text-white/25">{i + 1}</span>
                    <span
                      className="h-2 w-2 shrink-0 rounded-sm"
                      style={{ background: g.accent }}
                    />
                    <span className="truncate text-[12.5px] font-medium text-white/80">
                      {g.title}
                    </span>
                  </div>
                  <span className="shrink-0 text-[11px] font-semibold text-white/40">
                    {g.sessions}
                  </span>
                </div>
                <div className="ml-6 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                  <div
                    className="h-full rounded-full transition-all duration-500 group-hover:brightness-125"
                    style={{
                      width: `${(g.sessions / (topGames[0]?.sessions || 1)) * 100}%`,
                      background: `linear-gradient(90deg, ${g.accent}66, ${g.accent})`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <Link
              href="/stations"
              className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 text-[11px] font-medium text-white/60 transition hover:border-white/15 hover:text-white"
            >
              <MonitorPlay className="h-3.5 w-3.5 text-violet-soft" /> Stations
            </Link>
            <Link
              href="/games"
              className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 text-[11px] font-medium text-white/60 transition hover:border-white/15 hover:text-white"
            >
              <Gamepad2 className="h-3.5 w-3.5 text-cyan" /> Games
            </Link>
          </div>
        </SectionCard>

        <SectionCard
          title="Upcoming tournaments"
          subtitle="Brackets filling up"
          action={
            <Link href="/tournaments" className="text-[11px] font-semibold text-white/40 hover:text-white">
              All
            </Link>
          }
        >
          <div className="space-y-2.5">
            {upcoming.map((t) => {
              const fill = Math.round((t.registered / t.max_players) * 100);
              return (
                <Link
                  key={t.id}
                  href="/tournaments"
                  className="block rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition hover:border-violet/30 hover:bg-violet/[0.05]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[12.5px] font-semibold text-white/90">{t.name}</p>
                      <p className="mt-0.5 text-[10.5px] text-muted">
                        {formatDate(t.starts_at)} · {formatTime(t.starts_at)}
                      </p>
                    </div>
                    <Badge tone={t.status} dot={t.status === "live"}>
                      {t.status}
                    </Badge>
                  </div>
                  <div className="mt-2.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${fill}%`,
                          background: `linear-gradient(90deg, ${t.game_accent ?? "#8b5cf6"}88, ${t.game_accent ?? "#8b5cf6"})`,
                        }}
                      />
                    </div>
                    <span className="shrink-0 text-[10px] font-semibold text-white/40">
                      {t.registered}/{t.max_players}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10.5px]">
                    <span className="flex items-center gap-1 text-amber">
                      <Trophy className="h-3 w-3" /> {currency(t.prize_pool, { compact: true })}
                    </span>
                    <span className="text-white/35">{t.entry_fee ? `${currency(t.entry_fee)} entry` : "Free entry"}</span>
                  </div>
                </Link>
              );
            })}
            {upcoming.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <Sparkles className="h-5 w-5 text-violet-soft" />
                <p className="text-xs text-muted">No tournaments scheduled yet.</p>
                <Link href="/tournaments?new=1" className="btn-secondary btn-sm">
                  Create one
                </Link>
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      {/* footer strip */}
      <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.015] px-5 py-4 sm:flex-row">
        <div className="flex items-center gap-2 text-[11px] text-white/35">
          <Avatar name={user?.name ?? "Nexus"} size="xs" color="#8b5cf6" />
          Signed in as <span className="font-semibold text-white/70">{user?.email}</span>
          <span className="rounded bg-violet/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-soft">
            {user?.role}
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-white/30">
          <span>30-day revenue {currency(stats.revenueMonth, { compact: true })}</span>
          <span className="h-3 w-px bg-white/10" />
          <span>{number(stats.totalMembers)} members</span>
          <span className="h-3 w-px bg-white/10" />
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-lime" /> synced
          </span>
        </div>
      </div>
    </div>
  );
}
