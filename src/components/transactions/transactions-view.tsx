"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  Banknote,
  CreditCard,
  Gamepad2,
  Plus,
  Receipt,
  RotateCcw,
  ShoppingBag,
  Ticket,
  Trash2,
  TrendingUp,
  Trophy,
  Utensils,
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
import { Field, Input, Select } from "@/components/ui/field";
import { RowMenu } from "@/components/ui/row-menu";
import { useServerAction } from "@/lib/use-server-action";
import {
  createTransaction,
  deleteTransaction,
  updateTransactionStatus,
  type TransactionInput,
} from "@/lib/actions/transactions";
import {
  PAYMENT_METHODS,
  TRANSACTION_STATUSES,
  TRANSACTION_TYPES,
  type Member,
  type Transaction,
  type TransactionStatus,
  type TransactionType,
} from "@/lib/types";
import { cn, currency, formatDate, formatTime, number } from "@/lib/utils";

type Mode = { kind: "create" };
type Tab = "all" | TransactionStatus;

const TYPE_META: Record<
  TransactionType,
  { label: string; icon: typeof Wallet; tone: string }
> = {
  booking: { label: "Booking", icon: Gamepad2, tone: "text-violet-soft" },
  tournament: { label: "Tournament", icon: Trophy, tone: "text-amber" },
  wallet_topup: { label: "Top-up", icon: Wallet, tone: "text-cyan" },
  merchandise: { label: "Merch", icon: ShoppingBag, tone: "text-pink" },
  snacks: { label: "Snacks", icon: Utensils, tone: "text-lime" },
};

const METHOD_ICON = {
  card: CreditCard,
  cash: Banknote,
  wallet: Wallet,
  upi: TrendingUp,
  crypto: Ticket,
} as const;

export function TransactionsView({
  initial,
  members,
  autoOpen,
}: {
  initial: Transaction[];
  members: Pick<Member, "id" | "name" | "tier" | "avatar_color" | "status">[];
  autoOpen?: boolean;
}) {
  const [rows, setRows] = useState(initial);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [type, setType] = useState("all");
  const [mode, setMode] = useState<Mode | null>(null);
  const [toDelete, setToDelete] = useState<Transaction | null>(null);
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

  const stats = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    const paid = rows.filter((r) => r.status === "paid");
    const today = paid
      .filter((r) => r.created_at.slice(0, 10) === todayKey)
      .reduce((s, r) => s + r.amount, 0);
    return {
      today,
      total: paid.reduce((s, r) => s + r.amount, 0),
      pending: rows.filter((r) => r.status === "pending").reduce((s, r) => s + r.amount, 0),
      refunded: rows.filter((r) => r.status === "refunded").reduce((s, r) => s + r.amount, 0),
    };
  }, [rows]);

  const counts = {
    all: rows.length,
    paid: rows.filter((r) => r.status === "paid").length,
    pending: rows.filter((r) => r.status === "pending").length,
    refunded: rows.filter((r) => r.status === "refunded").length,
    failed: rows.filter((r) => r.status === "failed").length,
  };

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    return (
      (!q ||
        r.reference.toLowerCase().includes(q) ||
        (r.member_name ?? "").toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)) &&
      (tab === "all" || r.status === tab) &&
      (type === "all" || r.type === type)
    );
  });

  async function handleCreate(values: TransactionInput) {
    const member = members.find((m) => m.id === values.member_id);
    const tempId = -Date.now();
    const optimistic: Transaction = {
      id: tempId,
      member_id: values.member_id,
      type: values.type as TransactionType,
      amount: Number(values.amount),
      method: values.method as Transaction["method"],
      status: values.status as TransactionStatus,
      reference: "TXN-PENDING",
      description: values.description ?? "",
      created_at: new Date().toISOString(),
      member_name: member?.name,
      member_color: member?.avatar_color,
      member_tier: member?.tier,
    };
    setRows((r) => [optimistic, ...r]);
    const res = await execute(() => createTransaction(values));
    if (res?.ok) {
      setRows((r) =>
        r.map((x) => (x.id === tempId ? { ...optimistic, id: res.data!.id } : x)),
      );
      setMode(null);
      return true;
    }
    setRows((r) => r.filter((x) => x.id !== tempId));
    return false;
  }

  async function setStatus(t: Transaction, next: TransactionStatus) {
    const prev = t.status;
    setRows((r) => r.map((x) => (x.id === t.id ? { ...x, status: next } : x)));
    const res = await execute(() => updateTransactionStatus(t.id, next));
    if (!res?.ok) setRows((r) => r.map((x) => (x.id === t.id ? { ...x, status: prev } : x)));
  }

  async function handleDelete() {
    if (!toDelete) return;
    const snapshot = rows;
    const target = toDelete;
    setRows((r) => r.filter((x) => x.id !== target.id));
    const res = await execute(() => deleteTransaction(target.id));
    if (!res?.ok) setRows(snapshot);
    setToDelete(null);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Community"
        title="Transactions"
        description={`${number(rows.length)} ledger entries · ${currency(stats.total)} collected all time.`}
        actions={
          <Button onClick={() => setMode({ kind: "create" })}>
            <Plus className="h-4 w-4" /> Record payment
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Collected today", value: currency(stats.today), icon: Banknote, tone: "text-lime" },
          { label: "Ledger total", value: currency(stats.total, { compact: true }), icon: Receipt, tone: "text-violet-soft" },
          { label: "Pending", value: currency(stats.pending), icon: CreditCard, tone: "text-amber" },
          { label: "Refunded", value: currency(stats.refunded), icon: RotateCcw, tone: "text-danger" },
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
            { value: "paid", label: "Paid", count: counts.paid },
            { value: "pending", label: "Pending", count: counts.pending },
            { value: "refunded", label: "Refunded", count: counts.refunded },
            { value: "failed", label: "Failed", count: counts.failed },
          ]}
        />
      </div>

      <Toolbar
        search={search}
        onSearch={setSearch}
        placeholder="Search reference, member or description…"
        filters={
          <FilterSelect
            label="Type"
            value={type}
            onChange={setType}
            options={TRANSACTION_TYPES.map((t) => ({ value: t, label: TYPE_META[t].label }))}
          />
        }
      />

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Receipt}
            title={rows.length === 0 ? "No transactions yet" : "No transactions match"}
            description={
              rows.length === 0
                ? "Payments captured from bookings and top-ups will appear here automatically."
                : "Try a different status, type or search term."
            }
            action={
              rows.length === 0 ? (
                <Button onClick={() => setMode({ kind: "create" })}>
                  <Plus className="h-4 w-4" /> Record payment
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearch("");
                    setTab("all");
                    setType("all");
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
              <table className="w-full min-w-[880px]">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.015]">
                    <th className="table-head px-4 py-3">Reference</th>
                    <th className="table-head px-4 py-3">Member</th>
                    <th className="table-head px-4 py-3">Description</th>
                    <th className="table-head px-4 py-3">Method</th>
                    <th className="table-head px-4 py-3">Amount</th>
                    <th className="table-head px-4 py-3">Status</th>
                    <th className="table-head px-4 py-3">Date</th>
                    <th className="table-head px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filtered.map((t) => {
                    const meta = TYPE_META[t.type];
                    const MetaIcon = meta.icon;
                    const MethodIcon = METHOD_ICON[t.method] ?? CreditCard;
                    return (
                      <tr key={t.id} className={cn("row-hover", t.id < 0 && "opacity-60")}>
                        <td className="px-4 py-3">
                          <p className="font-mono text-[11px] font-semibold text-white/70">
                            {t.reference}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1 text-[10.5px] text-white/30">
                            <MetaIcon className={cn("h-2.5 w-2.5", meta.tone)} />
                            {meta.label}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar
                              name={t.member_name ?? "?"}
                              color={t.member_color}
                              size="xs"
                            />
                            <span className="max-w-[140px] truncate text-[12px] font-medium text-white/80">
                              {t.member_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="max-w-[220px] truncate text-[11.5px] text-white/50">
                            {t.description || "—"}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 text-[11px] uppercase text-white/45">
                            <MethodIcon className="h-3 w-3" /> {t.method}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "text-[12.5px] font-semibold",
                              t.status === "refunded"
                                ? "text-danger"
                                : t.status === "pending"
                                  ? "text-amber"
                                  : "text-lime",
                            )}
                          >
                            {t.status === "refunded" ? "−" : "+"}
                            {currency(t.amount)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={t.status} dot>
                            {t.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-[11.5px] text-white/60">{formatDate(t.created_at)}</p>
                          <p className="text-[10.5px] text-white/30">{formatTime(t.created_at)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end">
                            <RowMenu
                              actions={[
                                ...(t.status !== "paid"
                                  ? [
                                      {
                                        label: "Mark as paid",
                                        icon: <ArrowDownLeft className="h-3.5 w-3.5" />,
                                        onClick: () => setStatus(t, "paid"),
                                      },
                                    ]
                                  : []),
                                ...(t.status === "paid"
                                  ? [
                                      {
                                        label: "Refund transaction",
                                        icon: <RotateCcw className="h-3.5 w-3.5" />,
                                        onClick: () => setStatus(t, "refunded"),
                                      },
                                    ]
                                  : []),
                                ...(t.status === "pending"
                                  ? [
                                      {
                                        label: "Mark as failed",
                                        onClick: () => setStatus(t, "failed"),
                                      },
                                    ]
                                  : []),
                                {
                                  label: "Delete entry",
                                  icon: <Trash2 className="h-3.5 w-3.5" />,
                                  danger: true,
                                  onClick: () => setToDelete(t),
                                },
                              ]}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-2.5 lg:hidden">
            {filtered.map((t) => {
              const meta = TYPE_META[t.type];
              const MetaIcon = meta.icon;
              return (
                <div key={t.id} className="card flex items-start gap-3 p-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03]">
                    <MetaIcon className={cn("h-4 w-4", meta.tone)} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[12.5px] font-semibold text-white/90">
                          {t.description || meta.label}
                        </p>
                        <p className="truncate text-[10.5px] text-white/35">
                          {t.member_name} · {t.reference}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 text-[13px] font-bold",
                          t.status === "refunded" ? "text-danger" : "text-lime",
                        )}
                      >
                        {currency(t.amount)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge tone={t.status}>{t.status}</Badge>
                        <span className="text-[10px] uppercase text-white/30">{t.method}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setToDelete(t)}
                          className="icon-btn h-7 w-7 hover:text-danger"
                          aria-label="Delete transaction"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <TransactionModal
        mode={mode}
        members={members}
        pending={pending}
        onClose={() => setMode(null)}
        onSave={handleCreate}
      />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        pending={pending}
        title="Delete transaction?"
        description={`${toDelete?.reference ?? "This entry"} will be removed from the ledger. Revenue figures will change.`}
        confirmLabel="Delete entry"
      />
    </div>
  );
}

function TransactionModal({
  mode,
  members,
  onClose,
  onSave,
  pending,
}: {
  mode: Mode | null;
  members: Pick<Member, "id" | "name" | "tier" | "avatar_color" | "status">[];
  onClose: () => void;
  onSave: (values: TransactionInput) => Promise<boolean>;
  pending: boolean;
}) {
  const [error, setError] = useState("");
  const [type, setType] = useState<TransactionType>("booking");

  useEffect(() => {
    setError("");
    setType("booking");
  }, [mode]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const values: TransactionInput = {
      member_id: Number(fd.get("member_id")),
      type: String(fd.get("type") ?? "booking"),
      amount: Number(fd.get("amount") ?? 0),
      method: String(fd.get("method") ?? "card"),
      status: String(fd.get("status") ?? "paid"),
      description: String(fd.get("description") ?? ""),
    };
    if (!values.member_id) {
      setError("Choose a member.");
      return;
    }
    if (!values.amount || values.amount <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    await onSave(values);
  }

  return (
    <Modal
      open={!!mode}
      onClose={onClose}
      title="Record a payment"
      description="Manual entries are added to the ledger and revenue reports."
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" form="txn-form" loading={pending}>
            Record payment
          </Button>
        </>
      }
    >
      <form id="txn-form" onSubmit={submit} className="space-y-4">
        {error && (
          <p className="rounded-lg border border-danger/25 bg-danger/[0.08] px-3 py-2 text-xs text-rose-200">
            {error}
          </p>
        )}
        <Field label="Member" required>
          <Select name="member_id" defaultValue={members[0]?.id} required>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} · {m.tier}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type">
            <Select
              name="type"
              value={type}
              onChange={(e) => setType(e.target.value as TransactionType)}
            >
              {TRANSACTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_META[t].label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Amount (USD)" required>
            <Input
              name="amount"
              type="number"
              min={0.01}
              step="0.01"
              defaultValue={25}
              required
            />
          </Field>
          <Field label="Method">
            <Select name="method" defaultValue="card">
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select name="status" defaultValue="paid">
              {TRANSACTION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field
          label="Description"
          hint={
            type === "wallet_topup"
              ? "Wallet top-ups also increase the member's balance."
              : undefined
          }
        >
          <Input name="description" placeholder="Energy drink + 1 hour rig time" />
        </Field>
      </form>
    </Modal>
  );
}
