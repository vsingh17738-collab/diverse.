"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Database,
  KeyRound,
  Loader2,
  RefreshCw,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { PageHeader, SectionCard } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Field, Input } from "@/components/ui/field";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useServerAction } from "@/lib/use-server-action";
import { changePassword, updateProfile } from "@/lib/actions/auth";
import { resetDemoData } from "@/lib/actions/settings";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

export function SettingsView({
  user,
  users,
  counts,
}: {
  user: { id: number; name: string; email: string; role: string; created_at: string };
  users: { id: number; name: string; email: string; role: string; created_at: string }[];
  counts: { members: number; stations: number; bookings: number; games: number; tournaments: number; transactions: number };
}) {
  const router = useRouter();
  const toast = useToast();
  const { execute, pending } = useServerAction();
  const { execute: resetting, pending: resetPending } = useServerAction();
  const [resetOpen, setResetOpen] = useState(false);
  const [error, setError] = useState("");

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await execute(() =>
      updateProfile({
        name: String(fd.get("name") ?? ""),
        email: String(fd.get("email") ?? ""),
      }),
    );
    if (res?.ok) router.refresh();
  }

  async function savePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setError("");
    const res = await execute(() =>
      changePassword({
        current: String(fd.get("current") ?? ""),
        next: String(fd.get("next") ?? ""),
        confirm: String(fd.get("confirm") ?? ""),
      }),
    );
    if (res?.ok) form.reset();
    else if (res && !res.ok) setError(res.error);
  }

  async function handleReset() {
    const res = await resetting(() => resetDemoData());
    setResetOpen(false);
    if (res?.ok) {
      toast.success("Demo data regenerated — reloading…");
      router.refresh();
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="System"
        title="Settings"
        description="Manage your account, team access and workspace data."
        actions={<Badge tone={user.role} dot>{user.role} access</Badge>}
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <SectionCard title="Profile" subtitle="Your name and sign-in email">
            <div className="mb-5 flex items-center gap-4">
              <Avatar name={user.name} size="lg" color="#8b5cf6" />
              <div>
                <p className="text-sm font-semibold text-white">{user.name}</p>
                <p className="text-[11.5px] text-muted">{user.email}</p>
                <p className="mt-1 text-[10.5px] text-white/30">
                  Member since {formatDate(user.created_at, { year: "numeric" })}
                </p>
              </div>
            </div>
            <form onSubmit={saveProfile} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Full name" required>
                  <Input name="name" defaultValue={user.name} required />
                </Field>
                <Field label="Email" required>
                  <Input name="email" type="email" defaultValue={user.email} required />
                </Field>
              </div>
              <div className="flex justify-end">
                <Button type="submit" loading={pending}>
                  <UserRound className="h-4 w-4" /> Save profile
                </Button>
              </div>
            </form>
          </SectionCard>

          <SectionCard title="Security" subtitle="Change your password">
            <form onSubmit={savePassword} className="space-y-4">
              {error && (
                <p className="rounded-lg border border-danger/25 bg-danger/[0.08] px-3 py-2 text-xs text-rose-200">
                  {error}
                </p>
              )}
              <Field label="Current password" required>
                <Input name="current" type="password" placeholder="••••••••" required />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="New password" required hint="Minimum 8 characters.">
                  <Input name="next" type="password" minLength={8} required />
                </Field>
                <Field label="Confirm new password" required>
                  <Input name="confirm" type="password" minLength={8} required />
                </Field>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-cyan/20 bg-cyan/[0.05] p-3">
                <p className="flex items-center gap-2 text-[11px] text-white/50">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-cyan" />
                  Passwords are hashed with bcrypt; sessions last 7 days.
                </p>
                <Button type="submit" variant="secondary" loading={pending}>
                  <KeyRound className="h-4 w-4" /> Update
                </Button>
              </div>
            </form>
          </SectionCard>

          {user.role === "owner" ? (
            <SectionCard
              title="Workspace data"
              subtitle="Regenerate the seeded demo dataset"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet/10 text-violet-soft">
                    <Database className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-[12.5px] font-semibold text-white">Reset demo data</p>
                    <p className="mt-0.5 max-w-md text-[11px] leading-relaxed text-muted">
                      Wipes members, stations, bookings, games, tournaments and transactions,
                      then reseeds a fresh, realistic dataset. Your login stays the same.
                    </p>
                  </div>
                </div>
                <Button variant="secondary" onClick={() => setResetOpen(true)} disabled={resetPending}>
                  {resetPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Reseed
                </Button>
              </div>
            </SectionCard>
          ) : (
            <SectionCard title="Workspace data" subtitle="Owner access required">
              <p className="text-[12px] leading-relaxed text-white/40">
                Reseeding demo data is restricted to the zone owner. Ask an owner
                if you need the sample dataset regenerated.
              </p>
            </SectionCard>
          )}
        </div>

        <div className="space-y-5">
          <SectionCard title="Team" subtitle={`${users.length} accounts with access`}>
            <ul className="space-y-3">
              {users.map((u) => (
                <li key={u.id} className="flex items-center gap-3">
                  <Avatar name={u.name} size="sm" color={u.role === "owner" ? "#fbbf24" : "#22d3ee"} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-medium text-white/85">{u.name}</p>
                    <p className="truncate text-[10.5px] text-white/35">{u.email}</p>
                  </div>
                  <Badge tone={u.role}>{u.role}</Badge>
                </li>
              ))}
            </ul>
            <p className="mt-4 flex items-center gap-1.5 text-[10.5px] text-white/25">
              <Users className="h-3 w-3" /> Invite flow available on the Pro plan.
            </p>
          </SectionCard>

          <SectionCard title="At a glance" subtitle="Current database contents">
            <ul className="space-y-2.5">
              {[
                { label: "Members", value: counts.members },
                { label: "Stations", value: counts.stations },
                { label: "Bookings", value: counts.bookings },
                { label: "Games", value: counts.games },
                { label: "Tournaments", value: counts.tournaments },
                { label: "Transactions", value: counts.transactions },
              ].map((row) => (
                <li
                  key={row.label}
                  className="flex items-center justify-between border-b border-white/[0.04] pb-2 text-[12px] last:border-0 last:pb-0"
                >
                  <span className="text-white/45">{row.label}</span>
                  <span className="font-semibold text-white/85">{row.value}</span>
                </li>
              ))}
            </ul>
          </SectionCard>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/35">
              Nexus Gaming Zone
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-white/30">
              Next.js 15 · SQLite (node:sqlite) · Tailwind CSS v4. Data persists to
              <span className="mx-1 rounded bg-white/[0.06] px-1 font-mono text-[10px] text-white/50">
                data/nexus.db
              </span>
            </p>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={handleReset}
        pending={resetPending}
        title="Reset all demo data?"
        description="Every member, station, booking, game, tournament and transaction will be deleted and regenerated with fresh sample data. This cannot be undone."
        confirmLabel="Reset & reseed"
      />
    </div>
  );
}
