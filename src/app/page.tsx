import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  CircuitBoard,
  Clock3,
  Crown,
  Gamepad2,
  Headset,
  MapPin,
  Play,
  Sparkles,
  Star,
  Trophy,
  Users,
  Wifi,
  Zap,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { getGames, getStations, getTournaments } from "@/lib/queries";
import { currency, formatDate, formatTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const NAV = [
  { label: "The floor", href: "#floor" },
  { label: "Library", href: "#library" },
  { label: "Tournaments", href: "#tournaments" },
  { label: "Pricing", href: "#pricing" },
];

const PRICING = [
  {
    name: "Casual",
    price: "$8",
    unit: "/ hour",
    blurb: "Walk in, grab a rig, jump into a lobby.",
    features: ["Any PC or console bay", "Steam & Game Pass library", "Free snacks on 3h+", "No membership needed"],
    accent: "#22d3ee",
  },
  {
    name: "Squad",
    price: "$25",
    unit: "/ 4 hours",
    blurb: "Four seats together with a private voice room.",
    features: ["4 stations side by side", "Private Discord channel", "Bring a 5th player free", "Priority on tournaments"],
    accent: "#8b5cf6",
    featured: true,
  },
  {
    name: "Pro",
    price: "$39",
    unit: "/ month",
    blurb: "For the regulars who basically live here.",
    features: ["20 hours of floor time", "15% off the snack bar", "Free tournament entries", "Guest pass every month"],
    accent: "#a3e635",
  },
];

export default async function LandingPage() {
  const [session, stations, games, tournaments] = await Promise.all([
    getSession(),
    Promise.resolve(getStations()),
    Promise.resolve(getGames()),
    Promise.resolve(getTournaments()),
  ]);

  const openNow = stations.filter((s) => s.status === "available").length;
  const featured = games
    .filter((g) => g.status === "available")
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 6);
  const upcoming = tournaments
    .filter((t) => t.status === "open" || t.status === "live")
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
    .slice(0, 3);
  const prizePool = tournaments.reduce((s, t) => s + t.prize_pool, 0);
  const primaryHref = session ? "/dashboard" : "/login";

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-base">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -left-40 -top-40 h-[560px] w-[560px] rounded-full bg-violet/[0.13] blur-[120px]" />
        <div className="absolute right-0 top-[420px] h-[460px] w-[460px] rounded-full bg-cyan/[0.07] blur-[130px]" />
      </div>

      {/* nav */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-base/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet to-[#5b21b6] shadow-[0_8px_20px_-6px_rgba(139,92,246,0.8)]">
              <CircuitBoard className="h-[18px] w-[18px] text-white" />
            </span>
            <span>
              <span className="block text-[15px] font-bold leading-none tracking-tight text-white">
                NEXUS
              </span>
              <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.22em] text-violet-soft/70">
                Gaming Zone
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-[13px] font-medium text-white/50 transition-colors hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {session ? (
              <Link href="/dashboard" className="btn-primary btn-sm sm:!px-4 sm:!py-2">
                Open dashboard <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="btn-ghost btn-sm hidden sm:inline-flex">
                  Sign in
                </Link>
                <Link href="/register" className="btn-primary btn-sm sm:!px-4 sm:!py-2">
                  Book a seat <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* hero */}
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="animate-[fade-up_0.5s_ease]">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-lime/25 bg-lime/[0.07] px-3 py-1.5 text-[11px] font-semibold text-lime">
                <span className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-lime" />
                {openNow} of {stations.length} stations free right now
              </div>
              <h1 className="text-[40px] font-bold leading-[1.05] tracking-tight text-white sm:text-[58px]">
                Your next level
                <br />
                <span className="bg-gradient-to-r from-violet-soft via-cyan to-lime bg-clip-text text-transparent">
                  starts on our floor.
                </span>
              </h1>
              <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-white/45">
                18 battle-stations, RTX 4090 rigs, VR pods, motion sim racing and a
                console lounge — plus weekly tournaments with real prize pools.
                Book a seat in seconds.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link href={primaryHref} className="btn-primary !px-5 !py-3">
                  <Play className="h-4 w-4" />
                  {session ? "Open dashboard" : "Book a seat"}
                </Link>
                <a href="#tournaments" className="btn-secondary !px-5 !py-3">
                  <Trophy className="h-4 w-4" /> See tournaments
                </a>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11.5px] text-white/35">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-violet-soft" /> Downtown · open 10am–2am
                </span>
                <span className="flex items-center gap-1.5">
                  <Wifi className="h-3.5 w-3.5 text-cyan" /> 1 Gbps fibre
                </span>
                <span className="flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 text-amber" /> 4.9 from 1,240 players
                </span>
              </div>
            </div>

            {/* live floor card */}
            <div className="relative animate-[fade-up_0.6s_ease]">
              <div className="absolute -inset-4 rounded-[32px] bg-gradient-to-br from-violet/20 to-cyan/10 blur-2xl" />
              <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0a0a12]/95 p-5 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">
                      Live floor status
                    </p>
                    <p className="mt-1 text-lg font-bold tracking-tight text-white">
                      {openNow} seats open
                    </p>
                  </div>
                  <Badge tone="active" dot>
                    live
                  </Badge>
                </div>
                <div className="space-y-2">
                  {stations.slice(0, 6).map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${
                            s.status === "available"
                              ? "bg-lime"
                              : s.status === "maintenance"
                                ? "bg-amber"
                                : "bg-violet"
                          }`}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-[12.5px] font-semibold text-white/85">
                            {s.name}
                          </p>
                          <p className="truncate text-[10.5px] text-white/30">
                            {s.kind} · {s.specs.split("·")[0]?.trim()}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-[11px] font-medium text-white/40">
                          {currency(s.hourly_rate)}/hr
                        </span>
                        <Badge tone={s.status}>{s.status === "available" ? "open" : s.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  href={session ? "/stations" : "/login"}
                  className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.03] py-2.5 text-[12px] font-semibold text-white/60 transition hover:border-violet/30 hover:text-white"
                >
                  View all {stations.length} stations <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* stat strip */}
          <div className="mt-14 grid grid-cols-2 gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-4 sm:grid-cols-4">
            {[
              { icon: Gamepad2, value: String(stations.length), label: "Battle stations" },
              { icon: Users, value: "1.2k+", label: "Registered players" },
              { icon: Trophy, value: currency(prizePool, { compact: true }), label: "Prize pools" },
              { icon: Clock3, value: "16h", label: "Open daily" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3 px-2">
                <s.icon className="h-4 w-4 shrink-0 text-violet-soft" />
                <div>
                  <p className="text-lg font-bold leading-none text-white">{s.value}</p>
                  <p className="mt-1 text-[10.5px] uppercase tracking-wider text-white/30">
                    {s.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* floor */}
        <section id="floor" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mb-8 max-w-2xl">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-violet-soft">
              The floor
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Six zones. One obsession.
            </h2>
            <p className="mt-2 text-sm text-white/40">
              Every seat is tuned, cleaned and monitored. Pick your poison.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Zap, title: "PC Arena", detail: "RTX 4090 / 4080 rigs, 360Hz panels, pro peripherals.", tone: "#8b5cf6", count: stations.filter((s) => s.zone === "PC Arena").length },
              { icon: Gamepad2, title: "Console Lounge", detail: "PS5 Pro, Xbox Series X and a Switch squad bench.", tone: "#22d3ee", count: stations.filter((s) => s.zone === "Console Lounge").length },
              { icon: Headset, title: "Immersive Lab", detail: "Quest 3 and Valve Index in a padded playspace.", tone: "#f472b6", count: stations.filter((s) => s.zone === "Immersive Lab").length },
              { icon: Sparkles, title: "Sim Speedway", detail: "Direct-drive wheels, load cells, motion seats.", tone: "#34d399", count: stations.filter((s) => s.zone === "Sim Speedway").length },
              { icon: Crown, title: "Retro Corner", detail: "N64, PS2 and a 60-in-1 arcade cabinet.", tone: "#fbbf24", count: stations.filter((s) => s.zone === "Retro Corner").length },
              { icon: CircuitBoard, title: "Creator Studio", detail: "Stream-ready suite with mics, capture and lights.", tone: "#a3e635", count: stations.filter((s) => s.zone === "Creator Studio").length },
            ].map((z) => (
              <div
                key={z.title}
                className="card card-hover group relative overflow-hidden p-5"
              >
                <div
                  className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full opacity-[0.12] blur-2xl transition-opacity group-hover:opacity-25"
                  style={{ background: z.tone }}
                />
                <div className="flex items-center justify-between">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl border"
                    style={{ borderColor: `${z.tone}33`, background: `${z.tone}14`, color: z.tone }}
                  >
                    <z.icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="text-[10.5px] font-medium text-white/30">
                    {z.count} station{z.count === 1 ? "" : "s"}
                  </span>
                </div>
                <h3 className="mt-4 text-[15px] font-semibold tracking-tight text-white">
                  {z.title}
                </h3>
                <p className="mt-1 text-[12px] leading-relaxed text-white/40">{z.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* library */}
        <section id="library" className="border-y border-white/[0.06] bg-white/[0.012] py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-cyan">
                  Game library
                </p>
                <h2 className="text-3xl font-bold tracking-tight text-white">
                  {games.length} titles, ready to launch.
                </h2>
                <p className="mt-2 text-sm text-white/40">
                  Steam, Game Pass and console libraries — all logged in and updated.
                </p>
              </div>
              <Link href={session ? "/games" : "/login"} className="btn-secondary btn-sm">
                Browse library <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((g) => (
                <div
                  key={g.id}
                  className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-panel/60 p-3.5 transition-all hover:border-white/15 hover:bg-panel-2/80"
                >
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-[13px] font-bold"
                    style={{
                      borderColor: `${g.accent}33`,
                      background: `${g.accent}14`,
                      color: g.accent,
                    }}
                  >
                    {g.title.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-white/90">{g.title}</p>
                    <p className="truncate text-[10.5px] text-white/35">
                      {g.platform} · {g.genre} · {g.players}
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-amber">
                    <Star className="h-3 w-3 fill-amber" /> {g.rating.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* tournaments */}
        <section id="tournaments" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mb-8 max-w-2xl">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-amber">
              Tournaments
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Cash on the line, every week.
            </h2>
            <p className="mt-2 text-sm text-white/40">
              Brackets run on the floor and streamed live. Walk-ins welcome until
              check-in closes.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {upcoming.map((t) => (
              <div key={t.id} className="card overflow-hidden">
                <div
                  className="h-1.5 w-full"
                  style={{ background: t.game_accent ?? "#8b5cf6" }}
                />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[15px] font-semibold tracking-tight text-white">
                      {t.name}
                    </h3>
                    <Badge tone={t.status} dot={t.status === "live"}>
                      {t.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[11.5px] text-muted">
                    {t.game_title ?? "Multi-game"} · {t.format}
                  </p>
                  <div className="mt-4 flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                    <div>
                      <p className="text-[9.5px] uppercase tracking-wider text-white/30">Prize</p>
                      <p className="text-[15px] font-bold text-amber">
                        {currency(t.prize_pool)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9.5px] uppercase tracking-wider text-white/30">Entry</p>
                      <p className="text-[13px] font-semibold text-white">
                        {t.entry_fee ? currency(t.entry_fee) : "Free"}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 flex items-center gap-1.5 text-[11px] text-white/40">
                    <CalendarClock className="h-3.5 w-3.5" />
                    {formatDate(t.starts_at, { weekday: "short", day: "numeric", month: "short" })} ·{" "}
                    {formatTime(t.starts_at)} · {t.registered}/{t.max_players} slots
                  </p>
                  <Link
                    href={session ? "/tournaments" : "/login"}
                    className="mt-4 flex items-center justify-center gap-1.5 rounded-lg border border-violet/30 bg-violet/10 py-2 text-[11.5px] font-semibold text-violet-soft transition hover:bg-violet/20"
                  >
                    {t.registered >= t.max_players ? "Join waitlist" : "Register"}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* pricing */}
        <section id="pricing" className="border-y border-white/[0.06] bg-white/[0.012] py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-10 max-w-2xl">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-lime">
                Pricing
              </p>
              <h2 className="text-3xl font-bold tracking-tight text-white">
                Simple rates, no surprise fees.
              </h2>
              <p className="mt-2 text-sm text-white/40">
                Pay at the counter or straight from your member wallet.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {PRICING.map((p) => (
                <div
                  key={p.name}
                  className={`relative overflow-hidden rounded-2xl border p-5 ${
                    p.featured
                      ? "border-violet/40 bg-gradient-to-b from-violet/[0.12] to-transparent"
                      : "border-white/[0.07] bg-panel/60"
                  }`}
                >
                  {p.featured && (
                    <span className="absolute right-4 top-4 rounded-full bg-violet px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-white">
                      Popular
                    </span>
                  )}
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: p.accent }}>
                    {p.name}
                  </p>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-bold tracking-tight text-white">{p.price}</span>
                    <span className="text-[11px] text-white/35">{p.unit}</span>
                  </div>
                  <p className="mt-2 text-[12px] text-white/40">{p.blurb}</p>
                  <ul className="mt-4 space-y-2">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-[12px] text-white/55">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full" style={{ background: p.accent }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={session ? "/bookings?new=1" : "/register"}
                    className={`mt-5 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12px] font-semibold transition ${
                      p.featured
                        ? "bg-violet text-white hover:bg-violet/90"
                        : "border border-white/[0.08] bg-white/[0.03] text-white/70 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    Book {p.name} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* cta */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl border border-violet/25 bg-gradient-to-br from-violet/[0.16] via-[#0c0c16] to-cyan/[0.08] px-6 py-12 text-center">
            <div className="pointer-events-none absolute inset-0 grid-bg opacity-50" />
            <div className="relative">
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                The lobby is filling up.
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-white/45">
                Grab a seat for tonight, or sign in to the operations dashboard if
                you run the floor.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link href={primaryHref} className="btn-primary !px-5 !py-3">
                  <Play className="h-4 w-4" /> {session ? "Open dashboard" : "Reserve a station"}
                </Link>
                <Link href="/register" className="btn-secondary !px-5 !py-3">
                  Create account
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/[0.06] py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-[11px] text-white/30 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <CircuitBoard className="h-3.5 w-3.5 text-violet-soft" />
            <span>© {new Date().getFullYear()} Nexus Gaming Zone</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="#floor" className="hover:text-white">The floor</a>
            <a href="#pricing" className="hover:text-white">Pricing</a>
            <Link href="/login" className="hover:text-white">Staff login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
