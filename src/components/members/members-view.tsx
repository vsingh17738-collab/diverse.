"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  CalendarDays,
  Crown,
  Mail,
  Pencil,
  Phone,
  Plus,
  Receipt,
  Trash2,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Toolbar, FilterSelect, Segmented } from "@/components/ui/toolbar";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { RowMenu } from "@/components/ui/row-menu";
import { useServerAction } from "@/lib/use-server-action";
import {
  createMember,
  deleteMember,
  topUpWallet,
  updateMember,
  type MemberInput,
} from "@/lib/actions/members";
import {
  MEMBER_STATUSES,
  MEMBER_TIERS,
  type Member,
  type MemberStatus,
  type MemberTier,
} from "@/lib/types";
import { cn, currency, formatDate, number } from "@/lib/utils";

type Mode = { kind: "create" } | { kind: "edit"; member: Member };
type Tab = "all" | MemberStatus;

const TIER_ACCENT: Record<string, string> = {
  Bronze: "#d97706",
  Silver: "#cbd5e1",
  Gold: "#fbbf24",
  Platinum: "#22d3ee",
};

export function MembersView({ initial, autoOpen }: { initial: Member[]; autoOpen?: boolean }) {
  const [rows, setRows] = useState(initial);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [tier, setTier] = useState("all");
  const [mode, setMode] = useState<Mode | null>(null);
  const [toDelete, setToDelete] = useState<Member | null>(null);
  const [topUp, setTopUp] = useState<Member | null>(null);
  const [detail, setDetail] = useState<Member | null>(null);
  const { execute, pending } = useServerAction();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setRows(initial);
  }, [initial]);

  useEffect(() => {
    if (!autoOpen) return;
    setMode({ kind: "create" });
    // Drop the ?new=1 flag so the shortcut can be triggered again later.
    router.replace(pathname, { scroll: false });
  }, [autoOpen, pathname, router]);

  const stats = useMemo(
    () => ({
      total: rows.length,
      active: rows.filter((r) => r.status === "active").length,
      premium: rows.filter((r) => r.tier === "Platinum" || r.tier === "Gold").length,
      wallet: rows.reduce((s, r) => s + r.wallet_balance, 0),
      spent: rows.reduce((s, r) => s + (r.total_spent ?? 0), 0),
    }),
    [rows],
  );

  const counts = {
    all: rows.length,
    active: stats.active,
    inactive: rows.filter((r) => r.status === "inactive").length,
    banned: rows.filter((r) => r.status === "banned").length,
  };

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    return (
      (!q ||
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.phone.includes(q)) &&
      (tab === "all" || r.status === tab) &&
      (tier === "all" || r.tier === tier)
    );
  });

  async function handleSave(values: MemberInput) {
    if (!mode) return false;
    if (mode.kind === "create") {
      const tempId = -Date.now();
      const optimistic: Member = {
        id: tempId,
        name: values.name,
        email: values.email,
        phone: values.phone ?? "",
        tier: values.tier as MemberTier,
        status: values.status as MemberStatus,
        wallet_balance: Number(values.wallet_balance ?? 0),
        joined_at: new Date().toISOString(),
        notes: values.notes ?? "",
        avatar_color: "#22d3ee",
        total_spent: 0,
        bookings_count: 0,
      };
      setRows((r) => [optimistic, ...r]);
      const res = await execute(() => createMember(values));
      if (res?.ok) {
        setRows((r) => r.map((x) => (x.id === tempId ? { ...optimistic, id: res.data!.id } : x)));
        setMode(null);
        return true;
      }
      setRows((r) => r.filter((x) => x.id !== tempId));
      return false;
    }
    const target = mode.member;
    const optimistic: Member = {
      ...target,
      name: values.name,
      email: values.email,
      phone: values.phone ?? "",
      tier: values.tier as MemberTier,
      status: values.status as MemberStatus,
      wallet_balance: Number(values.wallet_balance ?? target.wallet_balance),
      notes: values.notes ?? "",
    };
    setRows((r) => r.map((x) => (x.id === target.id ? optimistic : x)));
    const res = await execute(() => updateMember(target.id, values));
    if (res?.ok) {
      setMode(null);
      return true;
    }
    setRows((r) => r.map((x) => (x.id === target.id ? target : x)));
    return false;
  }

  async function handleTopUp(member: Member, amount: number) {
    setRows((r) =>
      r.map((x) =>
        x.id === member.id
          ? {
              ...x,
              wallet_balance: x.wallet_balance + amount,
              total_spent: (x.total_spent ?? 0) + amount,
            }
          : x,
      ),
    );
    setTopUp(null);
    const res = await execute(() => topUpWallet(member.id, amount));
    if (!res?.ok) {
      setRows((r) =>
        r.map((x) =>
          x.id === member.id
            ? {
                ...x,
                wallet_balance: member.wallet_balance,
                total_spent: member.total_spent,
              }
            : x,
        ),
      );
    }
  }

  async function handleDelete() {
    if (!toDelete) return;
    const snapshot = rows;
    const target = toDelete;
    setRows((r) => r.filter((x) => x.id !== target.id));
    const res = await execute(() => deleteMember(target.id));
    if (!res?.ok) setRows(snapshot);
    setToDelete(null);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Community"
        title="Members"
        description={`${stats.total} players · ${stats.premium} on Gold or Platinum · ${currency(stats.wallet)} held in wallets.`}
        actions={
          <Button onClick={() => setMode({ kind: "create" })}>
            <UserPlus className="h-4 w-4" /> Add member
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Total members", value: number(stats.total), icon: Users, tone: "text-violet-soft" },
          { label: "Active", value: number(stats.active), icon: BadgeCheck, tone: "text-lime" },
          { label: "Premium tier", value: number(stats.premium), icon: Crown, tone: "text-amber" },
          { label: "Wallet float", value: currency(stats.wallet, { compact: true }), icon: Wallet, tone: "text-cyan" },
        ].map((s) => (
          <div key={s.label} className="card flex items-center gap-3 p-3.5">
            <s.icon className={cn("h-4 w-4 shrink-0", s.tone)} />
            <div className="min-w-0">
              <p className="truncate text-lg font-bold leading-none text-white">{s.value}</p>
              <p className="mt-1 truncate text-[10.5px] uppercase tracking-wider text-muted">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "all", label: "All", count: counts.all },
            { value: "active", label: "Active", count: counts.active },
            { value: "inactive", label: "Inactive", count: counts.inactive },
            { value: "banned", label: "Banned", count: counts.banned },
          ]}
        />
      </div>

      <Toolbar
        search={search}
        onSearch={setSearch}
        placeholder="Search name, email or phone…"
        filters={
          <FilterSelect
            label="Tier"
            value={tier}
            onChange={setTier}
            options={MEMBER_TIERS.map((t) => ({ value: t, label: t }))}
          />
        }
        right={
          <span className="text-[11px] text-white/30">
            Lifetime spend {currency(stats.spent)}
          </span>
        }
      />

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={UserPlus}
            title={rows.length === 0 ? "No members yet" : "No members match"}
            description={
              rows.length === 0
                ? "Register your first player to start tracking wallets, bookings and tiers."
                : "Try a different search or switch tier filters to find who you're looking for."
            }
            action={
              rows.length === 0 ? (
                <Button onClick={() => setMode({ kind: "create" })}>
                  <Plus className="h-4 w-4" /> Add member
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearch("");
                    setTab("all");
                    setTier("all");
                  }}
                >
                  Clear filters
                </Button>
              )
            }
          />
        </div>
      ) : (
        <>
          <div className="card hidden overflow-hidden lg:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px]">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.015]">
                    <th className="table-head px-4 py-3">Member</th>
                    <th className="table-head px-4 py-3">Tier</th>
                    <th className="table-head px-4 py-3">Status</th>
                    <th className="table-head px-4 py-3">Wallet</th>
                    <th className="table-head px-4 py-3">Lifetime spend</th>
                    <th className="table-head px-4 py-3">Sessions</th>
                    <th className="table-head px-4 py-3">Joined</th>
                    <th className="table-head px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filtered.map((m) => (
                    <tr
                      key={m.id}
                      className={cn("row-hover cursor-pointer", m.id < 0 && "opacity-60")}
                      onClick={() => setDetail(m)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={m.name} color={m.avatar_color} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate text-[12.5px] font-semibold text-white/90">
                              {m.name}
                            </p>
                            <p className="truncate text-[10.5px] text-white/35">{m.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={m.tier}>
                          <Crown className="h-2.5 w-2.5" /> {m.tier}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={m.status} dot>
                          {m.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-[12.5px] font-semibold text-lime">
                        {currency(m.wallet_balance)}
                      </td>
                      <td className="px-4 py-3 text-[12.5px] text-white/70">
                        {currency(m.total_spent ?? 0)}
                      </td>
                      <td className="px-4 py-3 text-[12px] text-white/50">
                        {m.bookings_count ?? 0}
                      </td>
                      <td className="px-4 py-3 text-[11.5px] text-white/40">
                        {formatDate(m.joined_at, { year: "numeric" })}
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setTopUp(m)}
                            className="icon-btn h-8 w-8 hover:border-lime/40 hover:text-lime"
                            aria-label={`Top up ${m.name}`}
                            title="Top up wallet"
                          >
                            <Wallet className="h-3.5 w-3.5" />
                          </button>
                          <RowMenu
                            actions={[
                              {
                                label: "View profile",
                                icon: <Users className="h-3.5 w-3.5" />,
                                onClick: () => setDetail(m),
                              },
                              {
                                label: "Edit member",
                                icon: <Pencil className="h-3.5 w-3.5" />,
                                onClick: () => setMode({ kind: "edit", member: m }),
                              },
                              {
                                label: "Top up wallet",
                                icon: <Wallet className="h-3.5 w-3.5" />,
                                onClick: () => setTopUp(m),
                              },
                              {
                                label: "Delete member",
                                icon: <Trash2 className="h-3.5 w-3.5" />,
                                danger: true,
                                onClick: () => setToDelete(m),
                              },
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
            {filtered.map((m) => (
              <div key={m.id} className="card p-3.5">
                <div className="flex items-start gap-3">
                  <Avatar name={m.name} color={m.avatar_color} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-white">{m.name}</p>
                        <p className="truncate text-[11px] text-white/35">{m.email}</p>
                      </div>
                      <Badge tone={m.status} dot>
                        {m.status}
                      </Badge>
                    </div>
                    <div className="mt-2.5 flex items-center gap-3 text-[11px]">
                      <Badge tone={m.tier}>{m.tier}</Badge>
                      <span className="font-semibold text-lime">{currency(m.wallet_balance)}</span>
                      <span className="text-white/35">{m.bookings_count ?? 0} sessions</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-white/[0.05] pt-2.5">
                  <span className="text-[10.5px] text-white/30">
                    Joined {formatDate(m.joined_at, { year: "numeric" })}
                  </span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setTopUp(m)} className="icon-btn h-8 w-8" aria-label="Top up">
                      <Wallet className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setMode({ kind: "edit", member: m })}
                      className="icon-btn h-8 w-8"
                      aria-label="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setToDelete(m)}
                      className="icon-btn h-8 w-8 hover:text-danger"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <MemberModal mode={mode} pending={pending} onClose={() => setMode(null)} onSave={handleSave} />

      <TopUpModal
        member={topUp}
        pending={pending}
        onClose={() => setTopUp(null)}
        onSubmit={handleTopUp}
      />

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title="Member profile"
        description="Quick view of account health and history."
        size="sm"
        footer={
          detail && (
            <>
              <Button variant="secondary" onClick={() => setDetail(null)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  setMode({ kind: "edit", member: detail });
                  setDetail(null);
                }}
              >
                <Pencil className="h-4 w-4" /> Edit member
              </Button>
            </>
          )
        }
      >
        {detail && (
          <div>
            <div className="flex items-center gap-3">
              <Avatar name={detail.name} color={detail.avatar_color} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-white">{detail.name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <Badge tone={detail.tier}>
                    <Crown className="h-2.5 w-2.5" /> {detail.tier}
                  </Badge>
                  <Badge tone={detail.status} dot>
                    {detail.status}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-[12px]">
              <p className="flex items-center gap-2 text-white/60">
                <Mail className="h-3.5 w-3.5 text-white/25" /> {detail.email}
              </p>
              <p className="flex items-center gap-2 text-white/60">
                <Phone className="h-3.5 w-3.5 text-white/25" /> {detail.phone || "No phone on file"}
              </p>
              <p className="flex items-center gap-2 text-white/60">
                <CalendarDays className="h-3.5 w-3.5 text-white/25" /> Joined{" "}
                {formatDate(detail.joined_at, { year: "numeric", day: "numeric" })}
              </p>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { label: "Wallet", value: currency(detail.wallet_balance), tone: "text-lime" },
                { label: "Spent", value: currency(detail.total_spent ?? 0), tone: "text-white" },
                { label: "Sessions", value: String(detail.bookings_count ?? 0), tone: "text-cyan" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 text-center"
                >
                  <p className={cn("text-[13px] font-bold", s.tone)}>{s.value}</p>
                  <p className="mt-0.5 text-[9.5px] uppercase tracking-wider text-white/30">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>

            {detail.notes && (
              <div className="mt-3 rounded-xl border border-amber/20 bg-amber/[0.05] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-amber/70">
                  Staff notes
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-white/65">{detail.notes}</p>
              </div>
            )}

            <Button
              variant="secondary"
              className="mt-3 w-full"
              onClick={() => {
                setTopUp(detail);
                setDetail(null);
              }}
            >
              <Receipt className="h-4 w-4" /> Top up wallet
            </Button>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        pending={pending}
        title="Delete member?"
        description={`${toDelete?.name ?? "This member"} and all of their bookings and transactions will be permanently removed.`}
        confirmLabel="Delete member"
      />
    </div>
  );
}

function MemberModal({
  mode,
  onClose,
  onSave,
  pending,
}: {
  mode: Mode | null;
  onClose: () => void;
  onSave: (values: MemberInput) => Promise<boolean>;
  pending: boolean;
}) {
  const member = mode?.kind === "edit" ? mode.member : undefined;
  const [error, setError] = useState("");

  useEffect(() => setError(""), [mode]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const values: MemberInput = {
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      tier: String(fd.get("tier") ?? "Bronze"),
      status: String(fd.get("status") ?? "active"),
      wallet_balance: Number(fd.get("wallet_balance") ?? 0),
      notes: String(fd.get("notes") ?? ""),
    };
    if (values.name.trim().length < 2) {
      setError("Enter the member's full name.");
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email)) {
      setError("Enter a valid email address.");
      return;
    }
    await onSave(values);
  }

  return (
    <Modal
      open={!!mode}
      onClose={onClose}
      title={member ? `Edit ${member.name}` : "Add a member"}
      description="Members get a wallet, a tier and a full session history."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" form="member-form" loading={pending}>
            {member ? "Save changes" : "Add member"}
          </Button>
        </>
      }
    >
      <form id="member-form" onSubmit={submit} className="space-y-4">
        {error && (
          <p className="rounded-lg border border-danger/25 bg-danger/[0.08] px-3 py-2 text-xs text-rose-200">
            {error}
          </p>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full name" required>
            <Input name="name" defaultValue={member?.name} placeholder="Aarav Mehta" required />
          </Field>
          <Field label="Email" required>
            <Input
              name="email"
              type="email"
              defaultValue={member?.email}
              placeholder="aarav@example.com"
              required
            />
          </Field>
          <Field label="Phone">
            <Input name="phone" defaultValue={member?.phone} placeholder="+1 (415) 555-0142" />
          </Field>
          <Field label="Tier">
            <Select name="tier" defaultValue={member?.tier ?? "Bronze"}>
              {MEMBER_TIERS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Account status">
            <Select name="status" defaultValue={member?.status ?? "active"}>
              {MEMBER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Wallet balance (USD)">
            <Input
              name="wallet_balance"
              type="number"
              min={0}
              step="0.01"
              defaultValue={member?.wallet_balance ?? 0}
            />
          </Field>
        </div>
        <Field label="Staff notes" hint="Only visible inside the dashboard.">
          <Textarea
            name="notes"
            defaultValue={member?.notes}
            placeholder="Prefers Rig 01, allergic to energy drinks…"
          />
        </Field>
      </form>
    </Modal>
  );
}

function TopUpModal({
  member,
  pending,
  onClose,
  onSubmit,
}: {
  member: Member | null;
  pending: boolean;
  onClose: () => void;
  onSubmit: (member: Member, amount: number) => Promise<void>;
}) {
  const [amount, setAmount] = useState(25);
  const presets = [10, 25, 50, 100];

  useEffect(() => {
    if (member) setAmount(25);
  }, [member]);

  return (
    <Modal
      open={!!member}
      onClose={onClose}
      title="Top up wallet"
      description={`Add credit for ${member?.name ?? "this member"} — logged as a payment.`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button
            loading={pending}
            onClick={() => member && onSubmit(member, amount)}
            disabled={amount <= 0}
          >
            Add {currency(amount)}
          </Button>
        </>
      }
    >
      <div className="mb-4 flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
        <div className="flex items-center gap-2.5">
          <Avatar name={member?.name ?? "?"} color={member?.avatar_color} size="sm" />
          <div>
            <p className="text-[12.5px] font-semibold text-white">{member?.name}</p>
            <p className="text-[10.5px] text-white/35">{member?.tier} tier</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[9.5px] uppercase tracking-wider text-white/30">Balance</p>
          <p className="text-[13px] font-semibold text-lime">
            {currency(member?.wallet_balance ?? 0)}
          </p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-4 gap-2">
        {presets.map((p) => (
          <button
            key={p}
            onClick={() => setAmount(p)}
            className={cn(
              "rounded-xl border py-2.5 text-[13px] font-semibold transition-all",
              amount === p
                ? "border-violet/50 bg-violet/15 text-white"
                : "border-white/[0.07] bg-white/[0.03] text-white/60 hover:border-white/20",
            )}
          >
            ${p}
          </button>
        ))}
      </div>

      <Field label="Custom amount">
        <Input
          type="number"
          min={1}
          max={2000}
          step="0.5"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
        />
      </Field>
      <p className="mt-2 text-[11px] text-white/30">
        Recorded as a wallet top-up transaction with a generated reference.
      </p>
    </Modal>
  );
}
