"use client";

import { useEffect, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { logoutAction } from "@/lib/actions/auth";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  CircuitBoard,
  Command,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { NAV_GROUPS, NAV_ITEMS } from "@/lib/nav";
import { cn, initials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Role } from "@/lib/types";

export function AppShell({
  children,
  user,
}: {
  children: ReactNode;
  user: { name: string; email: string; role: Role };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
    setNotifOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const current = NAV_ITEMS.find(
    (i) => pathname === i.href || pathname.startsWith(`${i.href}/`),
  );

  return (
    <div className="min-h-screen bg-base">
      {/* ambient background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-violet/[0.07] blur-[100px]" />
        <div className="absolute right-0 top-1/3 h-[360px] w-[360px] rounded-full bg-cyan/[0.05] blur-[110px]" />
      </div>

      {/* sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col border-r border-white/[0.06] bg-[#08080f]/95 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Link href="/dashboard" className="group flex items-center gap-2.5">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet to-[#5b21b6] shadow-[0_8px_20px_-6px_rgba(139,92,246,0.8)]">
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
          <button
            className="icon-btn h-8 w-8 lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-3">
          {NAV_GROUPS.map((group) => {
            const items = NAV_ITEMS.filter((i) => i.group === group);
            return (
              <div key={group}>
                <p className="px-3 pb-1.5 text-[9.5px] font-bold uppercase tracking-[0.18em] text-white/25">
                  {group}
                </p>
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const isActive =
                      pathname === item.href || pathname.startsWith(`${item.href}/`);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all",
                          isActive
                            ? "bg-gradient-to-r from-violet/[0.18] to-transparent text-white"
                            : "text-white/50 hover:bg-white/[0.04] hover:text-white/85",
                        )}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-violet shadow-[0_0_10px_rgba(139,92,246,0.9)]" />
                        )}
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0 transition-colors",
                            isActive ? "text-violet-soft" : "text-white/35 group-hover:text-white/70",
                          )}
                        />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="px-3 pb-3">
          <div className="relative overflow-hidden rounded-xl border border-violet/20 bg-gradient-to-br from-violet/[0.14] to-cyan/[0.05] p-3.5">
            <Sparkles className="mb-1.5 h-4 w-4 text-violet-soft" />
            <p className="text-[12px] font-semibold text-white">Floor is live</p>
            <p className="mt-0.5 text-[11px] leading-snug text-white/45">
              18 stations · peak hours 6–10pm
            </p>
            <span className="mt-2.5 inline-flex items-center gap-1.5 text-[10px] font-semibold text-lime">
              <span className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-lime" />
              All systems operational
            </span>
          </div>
        </div>

        <div className="relative border-t border-white/[0.06] p-3">
          {menuOpen && (
            <div className="absolute bottom-[72px] left-3 right-3 z-10 overflow-hidden rounded-xl border border-white/10 bg-[#12121d] p-1 shadow-2xl animate-[scale-in_0.15s_ease]">
              <Link
                href="/settings"
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-white/70 hover:bg-white/[0.06] hover:text-white"
              >
                <Settings className="h-4 w-4" /> Settings
              </Link>
              <Link
                href="/members"
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-white/70 hover:bg-white/[0.06] hover:text-white"
              >
                <UserRound className="h-4 w-4" /> Members
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] text-rose-300 hover:bg-white/[0.06]"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </form>
            </div>
          )}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex w-full items-center gap-2.5 rounded-xl p-2 text-left transition-colors hover:bg-white/[0.04]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet to-cyan text-[11px] font-bold text-white">
              {initials(user.name)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold text-white">
                {user.name}
              </span>
              <span className="block truncate text-[11px] capitalize text-white/35">
                {user.role}
              </span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-white/30" />
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* main */}
      <div className="relative z-10 lg:pl-[264px]">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/[0.06] bg-base/80 px-4 backdrop-blur-xl sm:px-6">
          <button
            className="icon-btn lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="hidden min-w-0 items-center gap-2 text-xs sm:flex">
            <span className="text-white/30">Nexus</span>
            <span className="text-white/15">/</span>
            <span className="font-medium text-white/80">{current?.label ?? "Dashboard"}</span>
          </div>

          <div className="flex flex-1 justify-end gap-2">
            <button
              onClick={() => setPaletteOpen(true)}
              className="group hidden items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-xs text-white/35 transition-colors hover:border-white/15 hover:text-white/60 sm:flex"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Search or jump to…</span>
              <kbd className="ml-4 flex items-center gap-0.5 rounded border border-white/10 bg-white/[0.05] px-1.5 py-0.5 text-[10px]">
                <Command className="h-2.5 w-2.5" />K
              </kbd>
            </button>
            <button
              onClick={() => setPaletteOpen(true)}
              className="icon-btn sm:hidden"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>

            <div className="relative">
              <button
                onClick={() => setNotifOpen((v) => !v)}
                className="icon-btn relative"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-violet ring-2 ring-base" />
              </button>
              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 top-11 z-20 w-[320px] overflow-hidden rounded-xl border border-white/10 bg-[#11111c] shadow-2xl animate-[scale-in_0.15s_ease]">
                    <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
                      <p className="text-xs font-semibold text-white">Notifications</p>
                      <Badge tone="active">3 new</Badge>
                    </div>
                    <div className="divide-y divide-white/[0.05]">
                      {[
                        { title: "Tekken 8 Throwdown is live", detail: "24/24 players checked in", tone: "text-danger" },
                        { title: "Console Bay 04 flagged", detail: "Maintenance started 40m ago", tone: "text-amber" },
                        { title: "New Platinum member", detail: "Elena Petrova upgraded tier", tone: "text-cyan" },
                      ].map((n) => (
                        <div key={n.title} className="px-4 py-3 hover:bg-white/[0.03]">
                          <p className={cn("text-[12px] font-medium", n.tone)}>{n.title}</p>
                          <p className="mt-0.5 text-[11px] text-white/35">{n.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <Link
              href="/bookings?new=1"
              className="btn-primary btn-sm sm:!px-3.5 sm:!py-2"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New booking</span>
              <span className="sm:hidden">Book</span>
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 sm:py-6">
          {children}
        </main>
      </div>

      <CommandPaletteLazy open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}

const CommandPaletteLazy = dynamic(
  () => import("./command-palette").then((m) => m.CommandPalette),
  { ssr: false },
);
