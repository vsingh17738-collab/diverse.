"use client";

import { useMemo, useState } from "react";
import {
  Cpu,
  Gamepad2,
  Gauge,
  Joystick,
  MonitorPlay,
  Pencil,
  Plus,
  Star,
  Swords,
  Trash2,
  Wrench,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Toolbar, FilterSelect, Segmented } from "@/components/ui/toolbar";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { useServerAction } from "@/lib/use-server-action";
import {
  createStation,
  deleteStation,
  setStationStatus,
  updateStation,
  type StationInput,
} from "@/lib/actions/stations";
import { STATION_KINDS, STATION_STATUSES, type Station } from "@/lib/types";
import { cn, currency, number } from "@/lib/utils";

const KIND_ICON = {
  PC: Cpu,
  Console: Gamepad2,
  VR: Joystick,
  Racing: Gauge,
  Retro: Swords,
} as const;

const STATUS_TONE: Record<string, string> = {
  available: "available",
  occupied: "occupied",
  reserved: "reserved",
  maintenance: "maintenance",
};

type Mode = { kind: "create" } | { kind: "edit"; station: Station };

export function StationsView({ initial }: { initial: Station[] }) {
  const [rows, setRows] = useState(initial);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [kind, setKind] = useState("all");
  const [mode, setMode] = useState<Mode | null>(null);
  const [toDelete, setToDelete] = useState<Station | null>(null);
  const { execute, pending } = useServerAction();

  const stats = useMemo(
    () => ({
      total: rows.length,
      available: rows.filter((r) => r.status === "available").length,
      occupied: rows.filter((r) => r.status === "occupied" || r.status === "reserved").length,
      maintenance: rows.filter((r) => r.status === "maintenance").length,
      hours: rows.reduce((s, r) => s + r.total_hours, 0),
    }),
    [rows],
  );

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    const matchQ =
      !q ||
      r.name.toLowerCase().includes(q) ||
      r.zone.toLowerCase().includes(q) ||
      r.specs.toLowerCase().includes(q);
    return (
      matchQ &&
      (status === "all" || r.status === status) &&
      (kind === "all" || r.kind === kind)
    );
  });

  async function handleSave(values: StationInput) {
    if (!mode) return false;
    if (mode.kind === "create") {
      const tempId = -Date.now();
      const optimistic: Station = {
        id: tempId,
        name: values.name,
        kind: values.kind as Station["kind"],
        zone: values.zone,
        specs: values.specs ?? "",
        hourly_rate: Number(values.hourly_rate),
        status: values.status as Station["status"],
        total_hours: 0,
        rating: Number(values.rating ?? 4.5),
        created_at: new Date().toISOString(),
      };
      setRows((r) => [optimistic, ...r]);
      const res = await execute(() => createStation(values));
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
    const target = mode.station;
    const optimistic: Station = {
      ...target,
      name: values.name,
      kind: values.kind as Station["kind"],
      zone: values.zone,
      specs: values.specs ?? "",
      hourly_rate: Number(values.hourly_rate),
      status: values.status as Station["status"],
      rating: Number(values.rating ?? target.rating),
    };
    setRows((r) => r.map((x) => (x.id === target.id ? optimistic : x)));
    const res = await execute(() => updateStation(target.id, values));
    if (res?.ok) {
      setMode(null);
      return true;
    }
    setRows((r) => r.map((x) => (x.id === target.id ? target : x)));
    return false;
  }

  async function quickStatus(station: Station, next: string) {
    const prev = station.status;
    setRows((r) =>
      r.map((x) => (x.id === station.id ? { ...x, status: next as Station["status"] } : x)),
    );
    const res = await execute(() => setStationStatus(station.id, next), { silent: true });
    if (!res?.ok) {
      setRows((r) => r.map((x) => (x.id === station.id ? { ...x, status: prev } : x)));
    }
  }

  async function handleDelete() {
    if (!toDelete) return;
    const target = toDelete;
    const snapshot = rows;
    setRows((r) => r.filter((x) => x.id !== target.id));
    const res = await execute(() => deleteStation(target.id));
    if (!res?.ok) setRows(snapshot);
    setToDelete(null);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Operations"
        title="Stations"
        description={`${stats.total} stations across 5 zones · ${number(stats.hours)} hours played all-time.`}
        actions={
          <Button onClick={() => setMode({ kind: "create" })}>
            <Plus className="h-4 w-4" /> Add station
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Available", value: stats.available, tone: "text-lime", icon: MonitorPlay },
          { label: "In use", value: stats.occupied, tone: "text-violet-soft", icon: Gamepad2 },
          { label: "Maintenance", value: stats.maintenance, tone: "text-amber", icon: Wrench },
          { label: "Total hours", value: number(stats.hours), tone: "text-cyan", icon: Star },
        ].map((s) => (
          <div key={s.label} className="card flex items-center gap-3 p-3.5">
            <s.icon className={cn("h-4 w-4 shrink-0", s.tone)} />
            <div>
              <p className="text-lg font-bold leading-none text-white">{s.value}</p>
              <p className="mt-1 text-[10.5px] uppercase tracking-wider text-muted">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <Toolbar
        search={search}
        onSearch={setSearch}
        placeholder="Search stations, zones, specs…"
        filters={
          <FilterSelect
            label="Kind"
            value={kind}
            onChange={setKind}
            options={STATION_KINDS.map((k) => ({ value: k, label: k }))}
          />
        }
        right={
          <Segmented
            value={status}
            onChange={setStatus}
            options={[
              { value: "all", label: "All", count: rows.length },
              { value: "available", label: "Open", count: stats.available },
              { value: "occupied", label: "Busy", count: stats.occupied },
            ]}
          />
        }
      />

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={MonitorPlay}
            title={rows.length === 0 ? "No stations yet" : "No stations match your filters"}
            description={
              rows.length === 0
                ? "Add your first rig or console bay to start taking bookings."
                : "Try a different search term or clear the filters to see the full floor."
            }
            action={
              rows.length === 0 ? (
                <Button onClick={() => setMode({ kind: "create" })}>
                  <Plus className="h-4 w-4" /> Add station
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearch("");
                    setStatus("all");
                    setKind("all");
                  }}
                >
                  Clear filters
                </Button>
              )
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s, i) => {
            const Icon = KIND_ICON[s.kind] ?? MonitorPlay;
            return (
              <div
                key={s.id}
                className={cn(
                  "card card-hover group relative overflow-hidden p-4",
                  s.id < 0 && "animate-pulse opacity-70",
                )}
                style={{ animation: `fade-up 0.4s ${Math.min(i, 8) * 0.03}s both` }}
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl border",
                        s.status === "available"
                          ? "border-lime/20 bg-lime/10 text-lime"
                          : s.status === "maintenance"
                            ? "border-amber/20 bg-amber/10 text-amber"
                            : "border-violet/25 bg-violet/10 text-violet-soft",
                      )}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold tracking-tight text-white">{s.name}</h3>
                      <p className="text-[11px] text-muted">
                        {s.zone} · {s.kind}
                      </p>
                    </div>
                  </div>
                  <Badge tone={STATUS_TONE[s.status]} dot>
                    {s.status}
                  </Badge>
                </div>

                <p className="mb-3 line-clamp-2 min-h-[32px] text-[11.5px] leading-relaxed text-white/40">
                  {s.specs || "No hardware specs recorded."}
                </p>

                <div className="mb-3 grid grid-cols-3 gap-2 rounded-xl border border-white/[0.05] bg-white/[0.02] p-2.5">
                  <div>
                    <p className="text-[9.5px] uppercase tracking-wider text-white/30">Rate</p>
                    <p className="text-[12.5px] font-semibold text-white">
                      {currency(s.hourly_rate)}
                      <span className="text-[10px] font-normal text-white/30">/hr</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[9.5px] uppercase tracking-wider text-white/30">Hours</p>
                    <p className="text-[12.5px] font-semibold text-white">{number(s.total_hours)}</p>
                  </div>
                  <div>
                    <p className="text-[9.5px] uppercase tracking-wider text-white/30">Rating</p>
                    <p className="flex items-center gap-1 text-[12.5px] font-semibold text-amber">
                      <Star className="h-3 w-3 fill-amber" /> {s.rating.toFixed(1)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <select
                    value={s.status}
                    onChange={(e) => quickStatus(s, e.target.value)}
                    aria-label={`Set status for ${s.name}`}
                    className="select h-8 flex-1 py-0 text-[11px]"
                  >
                    {STATION_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setMode({ kind: "edit", station: s })}
                    className="icon-btn h-8 w-8"
                    aria-label={`Edit ${s.name}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setToDelete(s)}
                    className="icon-btn h-8 w-8 hover:border-danger/30 hover:text-danger"
                    aria-label={`Delete ${s.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <StationModal
        mode={mode}
        pending={pending}
        onClose={() => setMode(null)}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        pending={pending}
        title="Delete station?"
        description={`${toDelete?.name ?? "This station"} and all of its bookings will be permanently removed. This cannot be undone.`}
      />
    </div>
  );
}

function StationModal({
  mode,
  onClose,
  onSave,
  pending,
}: {
  mode: Mode | null;
  onClose: () => void;
  onSave: (values: StationInput) => Promise<boolean>;
  pending: boolean;
}) {
  const station = mode?.kind === "edit" ? mode.station : undefined;
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const values: StationInput = {
      name: String(fd.get("name") ?? ""),
      kind: String(fd.get("kind") ?? "PC"),
      zone: String(fd.get("zone") ?? ""),
      specs: String(fd.get("specs") ?? ""),
      hourly_rate: Number(fd.get("hourly_rate") ?? 0),
      status: String(fd.get("status") ?? "available"),
      rating: Number(fd.get("rating") ?? 4.5),
    };
    if (values.name.trim().length < 2) {
      setError("Station name must be at least 2 characters.");
      return;
    }
    await onSave(values);
  }

  return (
    <Modal
      open={!!mode}
      onClose={onClose}
      title={station ? `Edit ${station.name}` : "Add a station"}
      description="Stations are bookable by the hour. Rates feed booking totals automatically."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" form="station-form" loading={pending}>
            {station ? "Save changes" : "Add station"}
          </Button>
        </>
      }
    >
      <form id="station-form" onSubmit={submit} className="space-y-4">
        {error && (
          <p className="rounded-lg border border-danger/25 bg-danger/[0.08] px-3 py-2 text-xs text-rose-200">
            {error}
          </p>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Station name" required>
            <Input name="name" defaultValue={station?.name} placeholder="Nexus Rig 07" required />
          </Field>
          <Field label="Kind" required>
            <Select name="kind" defaultValue={station?.kind ?? "PC"}>
              {STATION_KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Zone" required>
            <Input name="zone" defaultValue={station?.zone} placeholder="PC Arena" required />
          </Field>
          <Field label="Hourly rate (USD)" required>
            <Input
              name="hourly_rate"
              type="number"
              min={0}
              max={500}
              step="0.5"
              defaultValue={station?.hourly_rate ?? 8}
              required
            />
          </Field>
          <Field label="Status">
            <Select name="status" defaultValue={station?.status ?? "available"}>
              {STATION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Rating (0–5)">
            <Input
              name="rating"
              type="number"
              min={0}
              max={5}
              step="0.1"
              defaultValue={station?.rating ?? 4.5}
            />
          </Field>
        </div>
        <Field label="Hardware specs" hint="Shown to staff on the floor view.">
          <Textarea
            name="specs"
            defaultValue={station?.specs}
            placeholder='RTX 4090 · i9-14900K · 27" 360Hz'
          />
        </Field>
      </form>
    </Modal>
  );
}
