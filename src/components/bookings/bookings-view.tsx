"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Ban,
  CalendarClock,
  CalendarPlus,
  Check,
  Clock,
  CreditCard,
  Pencil,
  Play,
  Plus,
  Trash2,
  Users,
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
  createBooking,
  deleteBooking,
  setBookingStatus,
  updateBooking,
  type BookingInput,
} from "@/lib/actions/bookings";
import {
  BOOKING_STATUSES,
  PAYMENT_STATUSES,
  type Booking,
  type BookingStatus,
  type Game,
  type Member,
  type Station,
} from "@/lib/types";
import {
  cn,
  currency,
  durationLabel,
  formatDate,
  formatTime,
  toLocalInput,
} from "@/lib/utils";

type Mode = { kind: "create" } | { kind: "edit"; booking: Booking };
type Tab = "all" | BookingStatus;

function defaultStart() {
  const d = new Date();
  d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0);
  return toLocalInput(d.toISOString());
}

export function BookingsView({
  initial,
  members,
  stations,
  games,
  autoOpen,
}: {
  initial: Booking[];
  members: Pick<Member, "id" | "name" | "tier" | "avatar_color" | "status">[];
  stations: Pick<Station, "id" | "name" | "kind" | "hourly_rate" | "status">[];
  games: Pick<Game, "id" | "title" | "platform">[];
  autoOpen?: boolean;
}) {
  const [rows, setRows] = useState(initial);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [payment, setPayment] = useState("all");
  const [mode, setMode] = useState<Mode | null>(null);
  const [toDelete, setToDelete] = useState<Booking | null>(null);
  const { execute, pending } = useServerAction();

  useEffect(() => {
    setRows(initial);
  }, [initial]);

  useEffect(() => {
    if (autoOpen) setMode({ kind: "create" });
  }, [autoOpen]);

  const counts = useMemo(
    () => ({
      all: rows.length,
      upcoming: rows.filter((r) => r.status === "upcoming").length,
      active: rows.filter((r) => r.status === "active").length,
      completed: rows.filter((r) => r.status === "completed").length,
      cancelled: rows.filter((r) => r.status === "cancelled").length,
    }),
    [rows],
  );

  const revenue = rows
    .filter((r) => r.payment_status === "paid" && r.status !== "cancelled")
    .reduce((s, r) => s + r.total_amount, 0);
  const pendingPayments = rows.filter((r) => r.payment_status === "pending").length;

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    const matchQ =
      !q ||
      (r.member_name ?? "").toLowerCase().includes(q) ||
      (r.station_name ?? "").toLowerCase().includes(q) ||
      (r.game_title ?? "").toLowerCase().includes(q);
    return (
      matchQ &&
      (tab === "all" || r.status === tab) &&
      (payment === "all" || r.payment_status === payment)
    );
  });

  function optimisticRow(values: BookingInput, id: number): Booking {
    const member = members.find((m) => m.id === values.member_id);
    const station = stations.find((s) => s.id === values.station_id);
    const game = games.find((g) => g.id === values.game_id);
    const start = new Date(values.start_time);
    const end = new Date(start.getTime() + Number(values.duration) * 60000);
    return {
      id,
      member_id: values.member_id,
      station_id: values.station_id,
      game_id: values.game_id ?? null,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      status: values.status as BookingStatus,
      players: Number(values.players ?? 1),
      total_amount:
        Math.round(
          ((Number(values.duration) / 60) * (station?.hourly_rate ?? 0)) * 100,
        ) / 100,
      payment_status: values.payment_status as Booking["payment_status"],
      notes: values.notes ?? "",
      created_at: new Date().toISOString(),
      member_name: member?.name ?? "New member",
      member_tier: member?.tier,
      member_color: member?.avatar_color,
      station_name: station?.name ?? "Station",
      station_kind: station?.kind as Booking["station_kind"],
      game_title: game?.title,
    };
  }

  async function handleSave(values: BookingInput) {
    if (!mode) return false;
    if (mode.kind === "create") {
      const tempId = -Date.now();
      const optimistic = optimisticRow(values, tempId);
      setRows((r) => [optimistic, ...r]);
      const res = await execute(() => createBooking(values));
      if (res?.ok) {
        setRows((r) => r.map((x) => (x.id === tempId ? { ...x, id: res.data!.id } : x)));
        setMode(null);
        return true;
      }
      setRows((r) => r.filter((x) => x.id !== tempId));
      return false;
    }
    const target = mode.booking;
    const optimistic = { ...optimisticRow(values, target.id) };
    setRows((r) => r.map((x) => (x.id === target.id ? optimistic : x)));
    const res = await execute(() => updateBooking(target.id, values));
    if (res?.ok) {
      setMode(null);
      return true;
    }
    setRows((r) => r.map((x) => (x.id === target.id ? target : x)));
    return false;
  }

  async function quickStatus(booking: Booking, next: BookingStatus) {
    const prev = { ...booking };
    setRows((r) =>
      r.map((x) =>
        x.id === booking.id
          ? {
              ...x,
              status: next,
              payment_status:
                next === "completed" && x.payment_status === "pending"
                  ? "paid"
                  : x.payment_status,
            }
          : x,
      ),
    );
    const res = await execute(() => setBookingStatus(booking.id, next));
    if (!res?.ok) setRows((r) => r.map((x) => (x.id === booking.id ? prev : x)));
  }

  async function handleDelete() {
    if (!toDelete) return;
    const snapshot = rows;
    const target = toDelete;
    setRows((r) => r.filter((x) => x.id !== target.id));
    const res = await execute(() => deleteBooking(target.id));
    if (!res?.ok) setRows(snapshot);
    setToDelete(null);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Operations"
        title="Bookings"
        description={`${counts.active} live sessions · ${counts.upcoming} upcoming · ${currency(revenue)} collected so far.`}
        actions={
          <>
            <div className="hidden items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2 sm:flex">
              <CreditCard className="h-3.5 w-3.5 text-lime" />
              <span className="text-[11px] text-white/40">Pending</span>
              <span className="text-[12px] font-semibold text-white">{pendingPayments}</span>
            </div>
            <Button onClick={() => setMode({ kind: "create" })}>
              <Plus className="h-4 w-4" /> New booking
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "all", label: "All", count: counts.all },
            { value: "active", label: "Live", count: counts.active },
            { value: "upcoming", label: "Upcoming", count: counts.upcoming },
            { value: "completed", label: "Completed", count: counts.completed },
            { value: "cancelled", label: "Cancelled", count: counts.cancelled },
          ]}
        />
      </div>

      <Toolbar
        search={search}
        onSearch={setSearch}
        placeholder="Search by member, station or game…"
        filters={
          <FilterSelect
            label="Payment"
            value={payment}
            onChange={setPayment}
            options={PAYMENT_STATUSES.map((p) => ({ value: p, label: p }))}
          />
        }
        right={
          <span className="text-[11px] text-white/30">
            Showing {filtered.length} of {rows.length}
          </span>
        }
      />

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={CalendarPlus}
            title={rows.length === 0 ? "No bookings yet" : "No bookings match this view"}
            description={
              rows.length === 0
                ? "Create the first session and stations will show as occupied automatically."
                : "Adjust the filters or clear your search to see more sessions."
            }
            action={
              rows.length === 0 ? (
                <Button onClick={() => setMode({ kind: "create" })}>
                  <Plus className="h-4 w-4" /> New booking
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setTab("all");
                    setPayment("all");
                    setSearch("");
                  }}
                >
                  Reset filters
                </Button>
              )
            }
          />
        </div>
      ) : (
        <>
          {/* desktop table */}
          <div className="card hidden overflow-hidden lg:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.015]">
                    <th className="table-head px-4 py-3">Member</th>
                    <th className="table-head px-4 py-3">Station</th>
                    <th className="table-head px-4 py-3">Session</th>
                    <th className="table-head px-4 py-3">Players</th>
                    <th className="table-head px-4 py-3">Amount</th>
                    <th className="table-head px-4 py-3">Status</th>
                    <th className="table-head px-4 py-3">Payment</th>
                    <th className="table-head px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filtered.map((b) => (
                    <tr key={b.id} className={cn("row-hover", b.id < 0 && "opacity-60")}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            name={b.member_name ?? "?"}
                            color={b.member_color}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-[12.5px] font-semibold text-white/90">
                              {b.member_name}
                            </p>
                            <p className="text-[10.5px] capitalize text-white/35">
                              {b.member_tier} tier
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[12px] font-medium text-white/80">{b.station_name}</p>
                        <p className="text-[10.5px] text-white/35">{b.station_kind}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[12px] font-medium text-white/80">
                          {formatTime(b.start_time)} – {formatTime(b.end_time)}
                        </p>
                        <p className="text-[10.5px] text-white/35">
                          {formatDate(b.start_time, { weekday: "short" })} ·{" "}
                          {durationLabel(b.start_time, b.end_time)} · {b.game_title ?? "Open play"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-[12px] text-white/60">
                          <Users className="h-3 w-3 text-white/25" /> {b.players}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[12.5px] font-semibold text-white">
                        {currency(b.total_amount)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={b.status} dot={b.status === "active"}>
                          {b.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={b.payment_status}>{b.payment_status}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {b.status === "upcoming" && (
                            <button
                              onClick={() => quickStatus(b, "active")}
                              className="icon-btn h-8 w-8 hover:border-violet/40 hover:text-violet-soft"
                              aria-label="Start session"
                              title="Start session"
                            >
                              <Play className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {b.status === "active" && (
                            <button
                              onClick={() => quickStatus(b, "completed")}
                              className="icon-btn h-8 w-8 hover:border-lime/40 hover:text-lime"
                              aria-label="Complete session"
                              title="Complete session"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <RowMenu
                            actions={[
                              {
                                label: "Edit booking",
                                icon: <Pencil className="h-3.5 w-3.5" />,
                                onClick: () => setMode({ kind: "edit", booking: b }),
                              },
                              ...(b.status !== "cancelled"
                                ? [
                                    {
                                      label: "Cancel booking",
                                      icon: <Ban className="h-3.5 w-3.5" />,
                                      onClick: () => quickStatus(b, "cancelled"),
                                    },
                                  ]
                                : [
                                    {
                                      label: "Restore booking",
                                      icon: <Clock className="h-3.5 w-3.5" />,
                                      onClick: () => quickStatus(b, "upcoming"),
                                    },
                                  ]),
                              {
                                label: "Delete permanently",
                                icon: <Trash2 className="h-3.5 w-3.5" />,
                                danger: true,
                                onClick: () => setToDelete(b),
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

          {/* mobile cards */}
          <div className="space-y-3 lg:hidden">
            {filtered.map((b) => (
              <div key={b.id} className="card p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar name={b.member_name ?? "?"} color={b.member_color} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-white">{b.member_name}</p>
                      <p className="truncate text-[11px] text-muted">
                        {b.station_name} · {b.players}p
                      </p>
                    </div>
                  </div>
                  <Badge tone={b.status} dot={b.status === "active"}>
                    {b.status}
                  </Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg border border-white/[0.05] bg-white/[0.02] p-2.5 text-[11px]">
                  <div>
                    <p className="text-white/30">When</p>
                    <p className="font-medium text-white/80">
                      {formatDate(b.start_time)} · {formatTime(b.start_time)}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/30">Amount</p>
                    <p className="font-semibold text-white">{currency(b.total_amount)}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <Badge tone={b.payment_status}>{b.payment_status}</Badge>
                  <div className="flex items-center gap-1">
                    {b.status === "upcoming" && (
                      <button
                        onClick={() => quickStatus(b, "active")}
                        className="icon-btn h-8 w-8"
                        aria-label="Start session"
                      >
                        <Play className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {b.status === "active" && (
                      <button
                        onClick={() => quickStatus(b, "completed")}
                        className="icon-btn h-8 w-8"
                        aria-label="Complete session"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => setMode({ kind: "edit", booking: b })}
                      className="icon-btn h-8 w-8"
                      aria-label="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setToDelete(b)}
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

      <BookingModal
        mode={mode}
        pending={pending}
        members={members}
        stations={stations}
        games={games}
        onClose={() => setMode(null)}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        pending={pending}
        title="Delete booking?"
        description={`This will permanently remove ${toDelete?.member_name ?? "this"}'s session on ${toDelete?.station_name ?? "the station"}. Consider cancelling instead.`}
      />
    </div>
  );
}

function BookingModal({
  mode,
  onClose,
  onSave,
  pending,
  members,
  stations,
  games,
}: {
  mode: Mode | null;
  onClose: () => void;
  onSave: (values: BookingInput) => Promise<boolean>;
  pending: boolean;
  members: Pick<Member, "id" | "name" | "tier" | "avatar_color" | "status">[];
  stations: Pick<Station, "id" | "name" | "kind" | "hourly_rate" | "status">[];
  games: Pick<Game, "id" | "title" | "platform">[];
}) {
  const booking = mode?.kind === "edit" ? mode.booking : undefined;
  const [stationId, setStationId] = useState<number>(
    booking?.station_id ?? stations[0]?.id ?? 0,
  );
  const [duration, setDuration] = useState<number>(() => {
    if (!booking) return 60;
    return Math.max(
      30,
      Math.round(
        (new Date(booking.end_time).getTime() - new Date(booking.start_time).getTime()) / 60000,
      ),
    );
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (mode) {
      setStationId(booking?.station_id ?? stations[0]?.id ?? 0);
      setDuration(
        booking
          ? Math.max(
              30,
              Math.round(
                (new Date(booking.end_time).getTime() -
                  new Date(booking.start_time).getTime()) /
                  60000,
              ),
            )
          : 60,
      );
      setError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const station = stations.find((s) => s.id === stationId);
  const estimate = ((duration / 60) * (station?.hourly_rate ?? 0)).toFixed(2);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const values: BookingInput = {
      member_id: Number(fd.get("member_id")),
      station_id: Number(fd.get("station_id")),
      game_id: fd.get("game_id") ? Number(fd.get("game_id")) : null,
      start_time: new Date(String(fd.get("start_time"))).toISOString(),
      duration,
      players: Number(fd.get("players") ?? 1),
      status: String(fd.get("status") ?? "upcoming"),
      payment_status: String(fd.get("payment_status") ?? "pending"),
      notes: String(fd.get("notes") ?? ""),
    };
    if (!values.member_id || !values.station_id) {
      setError("Choose a member and a station.");
      return;
    }
    await onSave(values);
  }

  return (
    <Modal
      open={!!mode}
      onClose={onClose}
      title={booking ? "Edit booking" : "New booking"}
      description="Session totals are calculated from the station's hourly rate."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" form="booking-form" loading={pending}>
            {booking ? "Save changes" : "Create booking"}
          </Button>
        </>
      }
    >
      <form id="booking-form" onSubmit={submit} className="space-y-4">
        {error && (
          <p className="rounded-lg border border-danger/25 bg-danger/[0.08] px-3 py-2 text-xs text-rose-200">
            {error}
          </p>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Member" required>
            <Select name="member_id" defaultValue={booking?.member_id ?? members[0]?.id} required>
              {members.map((m) => (
                <option key={m.id} value={m.id} disabled={m.status === "banned"}>
                  {m.name} · {m.tier}
                  {m.status === "banned" ? " (banned)" : ""}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Station" required hint={station ? `${currency(station.hourly_rate)} / hour · ${station.status}` : undefined}>
            <Select
              name="station_id"
              value={stationId}
              onChange={(e) => setStationId(Number(e.target.value))}
              required
            >
              {stations.map((s) => (
                <option key={s.id} value={s.id} disabled={s.status === "maintenance"}>
                  {s.name} · {s.kind} · {currency(s.hourly_rate)}/hr
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Game">
            <Select name="game_id" defaultValue={booking?.game_id ?? ""}>
              <option value="">Open play / party game</option>
              {games.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title} · {g.platform}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Players">
            <Input
              name="players"
              type="number"
              min={1}
              max={8}
              defaultValue={booking?.players ?? 1}
            />
          </Field>
          <Field label="Start time" required>
            <Input
              name="start_time"
              type="datetime-local"
              defaultValue={booking ? toLocalInput(booking.start_time) : defaultStart()}
              required
            />
          </Field>
          <Field label="Duration">
            <Select
              name="duration"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            >
              {[30, 60, 90, 120, 150, 180, 240, 300].map((d) => (
                <option key={d} value={d}>
                  {d >= 60 ? `${d / 60} hour${d > 60 ? "s" : ""}` : `${d} minutes`}
                  {d === 60 ? " (default)" : ""}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Booking status">
            <Select name="status" defaultValue={booking?.status ?? "upcoming"}>
              {BOOKING_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Payment">
            <Select name="payment_status" defaultValue={booking?.payment_status ?? "pending"}>
              {PAYMENT_STATUSES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-violet/20 bg-violet/[0.07] px-4 py-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-soft/70">
              Estimated total
            </p>
            <p className="text-lg font-bold text-white">${estimate}</p>
          </div>
          <p className="text-right text-[11px] text-white/40">
            {duration} min × {currency(station?.hourly_rate ?? 0)}/hr
          </p>
        </div>

        <Field label="Notes" hint="Visible to staff on the floor.">
          <Textarea
            name="notes"
            defaultValue={booking?.notes}
            placeholder="Birthday party, needs extra controllers…"
          />
        </Field>
      </form>
    </Modal>
  );
}
