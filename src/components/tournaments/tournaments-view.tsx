"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Flame,
  Pencil,
  Plus,
  Radio,
  Ticket,
  Trash2,
  Trophy,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Toolbar, FilterSelect, Segmented } from "@/components/ui/toolbar";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { RowMenu } from "@/components/ui/row-menu";
import { useServerAction } from "@/lib/use-server-action";
import {
  createTournament,
  deleteTournament,
  registerPlayer,
  setTournamentStatus,
  updateTournament,
  type TournamentInput,
} from "@/lib/actions/tournaments";
import {
  TOURNAMENT_STATUSES,
  type Game,
  type Tournament,
  type TournamentStatus,
} from "@/lib/types";
import { cn, currency, formatDate, formatDateTime, formatTime, number, toLocalInput } from "@/lib/utils";

type Mode = { kind: "create" } | { kind: "edit"; tournament: Tournament };
type Tab = "all" | TournamentStatus;

const FORMATS = [
  "Single elimination · BO1",
  "Single elimination · BO3",
  "Double elimination",
  "Group stage + knockout",
  "Round robin",
  "Time trial",
];

export function TournamentsView({
  initial,
  games,
  autoOpen,
}: {
  initial: Tournament[];
  games: Pick<Game, "id" | "title" | "platform">[];
  autoOpen?: boolean;
}) {
  const [rows, setRows] = useState(initial);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [gameFilter, setGameFilter] = useState("all");
  const [mode, setMode] = useState<Mode | null>(null);
  const [toDelete, setToDelete] = useState<Tournament | null>(null);
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
      live: rows.filter((r) => r.status === "live").length,
      open: rows.filter((r) => r.status === "open").length,
      prize: rows.reduce((s, r) => s + r.prize_pool, 0),
      players: rows.reduce((s, r) => s + r.registered, 0),
    }),
    [rows],
  );

  const counts = {
    all: rows.length,
    live: stats.live,
    open: stats.open,
    draft: rows.filter((r) => r.status === "draft").length,
    completed: rows.filter((r) => r.status === "completed").length,
  };

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    return (
      (!q || r.name.toLowerCase().includes(q) || (r.game_title ?? "").toLowerCase().includes(q)) &&
      (tab === "all" || r.status === tab) &&
      (gameFilter === "all" || String(r.game_id) === gameFilter)
    );
  });

  async function handleSave(values: TournamentInput) {
    if (!mode) return false;
    const game = games.find((g) => g.id === Number(values.game_id));
    if (mode.kind === "create") {
      const tempId = -Date.now();
      const optimistic: Tournament = {
        id: tempId,
        name: values.name,
        game_id: values.game_id ?? null,
        starts_at: new Date(values.starts_at).toISOString(),
        entry_fee: Number(values.entry_fee),
        prize_pool: Number(values.prize_pool),
        max_players: Number(values.max_players),
        registered: Number(values.registered ?? 0),
        format: values.format,
        status: values.status as TournamentStatus,
        description: values.description ?? "",
        created_at: new Date().toISOString(),
        game_title: game?.title,
        game_accent: "#8b5cf6",
      };
      setRows((r) => [optimistic, ...r]);
      const res = await execute(() => createTournament(values));
      if (res?.ok) {
        setRows((r) => r.map((x) => (x.id === tempId ? { ...optimistic, id: res.data!.id } : x)));
        setMode(null);
        return true;
      }
      setRows((r) => r.filter((x) => x.id !== tempId));
      return false;
    }
    const target = mode.tournament;
    const optimistic: Tournament = {
      ...target,
      name: values.name,
      game_id: values.game_id ?? null,
      starts_at: new Date(values.starts_at).toISOString(),
      entry_fee: Number(values.entry_fee),
      prize_pool: Number(values.prize_pool),
      max_players: Number(values.max_players),
      registered: Number(values.registered ?? 0),
      format: values.format,
      status: values.status as TournamentStatus,
      description: values.description ?? "",
      game_title: game?.title ?? target.game_title,
    };
    setRows((r) => r.map((x) => (x.id === target.id ? optimistic : x)));
    const res = await execute(() => updateTournament(target.id, values));
    if (res?.ok) {
      setMode(null);
      return true;
    }
    setRows((r) => r.map((x) => (x.id === target.id ? target : x)));
    return false;
  }

  async function handleRegister(t: Tournament) {
    if (t.registered >= t.max_players) {
      await execute(async () => ({ ok: false as const, error: "This bracket is full." }));
      return;
    }
    setRows((r) =>
      r.map((x) => (x.id === t.id ? { ...x, registered: x.registered + 1 } : x)),
    );
    const res = await execute(() => registerPlayer(t.id));
    if (!res?.ok) {
      setRows((r) =>
        r.map((x) => (x.id === t.id ? { ...x, registered: t.registered } : x)),
      );
    }
  }

  async function handleStatus(t: Tournament, next: TournamentStatus) {
    const prev = t.status;
    setRows((r) => r.map((x) => (x.id === t.id ? { ...x, status: next } : x)));
    const res = await execute(() => setTournamentStatus(t.id, next));
    if (!res?.ok) {
      setRows((r) => r.map((x) => (x.id === t.id ? { ...x, status: prev } : x)));
    }
  }

  async function handleDelete() {
    if (!toDelete) return;
    const snapshot = rows;
    const target = toDelete;
    setRows((r) => r.filter((x) => x.id !== target.id));
    const res = await execute(() => deleteTournament(target.id));
    if (!res?.ok) setRows(snapshot);
    setToDelete(null);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Community"
        title="Tournaments"
        description={`${stats.live} live · ${stats.open} accepting entries · ${currency(stats.prize)} in prize pools.`}
        actions={
          <Button onClick={() => setMode({ kind: "create" })}>
            <Plus className="h-4 w-4" /> Create tournament
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Live now", value: stats.live, icon: Radio, tone: "text-danger" },
          { label: "Open entries", value: stats.open, icon: Ticket, tone: "text-cyan" },
          { label: "Prize pools", value: currency(stats.prize, { compact: true }), icon: Trophy, tone: "text-amber" },
          { label: "Players entered", value: number(stats.players), icon: Users, tone: "text-violet-soft" },
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
            { value: "live", label: "Live", count: counts.live },
            { value: "open", label: "Open", count: counts.open },
            { value: "draft", label: "Draft", count: counts.draft },
            { value: "completed", label: "Completed", count: counts.completed },
          ]}
        />
      </div>

      <Toolbar
        search={search}
        onSearch={setSearch}
        placeholder="Search tournaments or games…"
        filters={
          <FilterSelect
            label="Game"
            value={gameFilter}
            onChange={setGameFilter}
            options={games.map((g) => ({ value: String(g.id), label: g.title }))}
          />
        }
      />

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Trophy}
            title={rows.length === 0 ? "No tournaments yet" : "No tournaments match"}
            description={
              rows.length === 0
                ? "Spin up your first bracket — set entry fees, prize pools and capacity."
                : "Try another filter or create a new event."
            }
            action={
              <Button onClick={() => setMode({ kind: "create" })}>
                <Plus className="h-4 w-4" /> Create tournament
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((t, i) => {
            const fill = Math.round((t.registered / t.max_players) * 100);
            const accent = t.game_accent ?? "#8b5cf6";
            return (
              <div
                key={t.id}
                className={cn(
                  "card card-hover group relative overflow-hidden",
                  t.id < 0 && "animate-pulse opacity-70",
                )}
                style={{ animation: `fade-up 0.4s ${Math.min(i, 8) * 0.03}s both` }}
              >
                <div
                  className="h-20 w-full border-b border-white/[0.05]"
                  style={{
                    background: `radial-gradient(circle at 20% 120%, ${accent}45, transparent 70%), linear-gradient(135deg, ${accent}18, transparent)`,
                  }}
                >
                  <div className="flex h-full items-start justify-between p-3.5">
                    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/25 px-2 py-1 backdrop-blur-sm">
                      <Trophy className="h-3 w-3" style={{ color: accent }} />
                      <span className="text-[10.5px] font-semibold text-white/80">
                        {t.game_title ?? "Multi-game"}
                      </span>
                    </div>
                    <Badge tone={t.status} dot={t.status === "live"}>
                      {t.status}
                    </Badge>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="truncate text-[14px] font-semibold tracking-tight text-white">
                    {t.name}
                  </h3>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted">
                    <CalendarDays className="h-3 w-3" />
                    {formatDate(t.starts_at, { weekday: "short", day: "numeric", month: "short" })} ·{" "}
                    {formatTime(t.starts_at)}
                  </p>
                  <p className="mt-2 line-clamp-2 min-h-[30px] text-[11px] leading-relaxed text-white/35">
                    {t.description || t.format}
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
                      <p className="text-[9.5px] uppercase tracking-wider text-white/30">Prize pool</p>
                      <p className="text-[13px] font-bold text-amber">{currency(t.prize_pool)}</p>
                    </div>
                    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
                      <p className="text-[9.5px] uppercase tracking-wider text-white/30">Entry</p>
                      <p className="text-[13px] font-bold text-white">
                        {t.entry_fee ? currency(t.entry_fee) : "Free"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-[10.5px]">
                      <span className="text-white/40">{t.format}</span>
                      <span className="font-semibold text-white/60">
                        {t.registered}/{t.max_players}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, fill)}%`,
                          background: `linear-gradient(90deg, ${accent}88, ${accent})`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 border-t border-white/[0.05] pt-3">
                    <button
                      onClick={() => handleRegister(t)}
                      disabled={t.registered >= t.max_players}
                      className={cn(
                        "flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border text-[11px] font-semibold transition-all",
                        t.registered >= t.max_players
                          ? "cursor-not-allowed border-white/[0.06] bg-white/[0.02] text-white/25"
                          : "border-violet/30 bg-violet/10 text-violet-soft hover:bg-violet/20",
                      )}
                    >
                      <Plus className="h-3 w-3" />
                      {t.registered >= t.max_players ? "Bracket full" : "Register player"}
                    </button>
                    {t.status === "open" && (
                      <button
                        onClick={() => handleStatus(t, "live")}
                        className="icon-btn h-8 w-8 hover:border-danger/40 hover:text-danger"
                        aria-label="Start tournament"
                        title="Start tournament"
                      >
                        <Flame className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {t.status === "live" && (
                      <button
                        onClick={() => handleStatus(t, "completed")}
                        className="icon-btn h-8 w-8 hover:border-lime/40 hover:text-lime"
                        aria-label="Complete tournament"
                        title="Complete tournament"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <RowMenu
                      actions={[
                        {
                          label: "Edit tournament",
                          icon: <Pencil className="h-3.5 w-3.5" />,
                          onClick: () => setMode({ kind: "edit", tournament: t }),
                        },
                        ...TOURNAMENT_STATUSES.filter((s) => s !== t.status).map((s) => ({
                          label: `Mark ${s}`,
                          onClick: () => handleStatus(t, s),
                        })),
                        {
                          label: "Delete tournament",
                          icon: <Trash2 className="h-3.5 w-3.5" />,
                          danger: true,
                          onClick: () => setToDelete(t),
                        },
                      ]}
                    />
                  </div>
                  <p className="mt-2 text-center text-[10px] text-white/20">
                    Starts {formatDateTime(t.starts_at)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TournamentModal
        mode={mode}
        games={games}
        pending={pending}
        onClose={() => setMode(null)}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        pending={pending}
        title="Delete tournament?"
        description={`"${toDelete?.name ?? "This tournament"}" and its registrations will be permanently deleted.`}
        confirmLabel="Delete tournament"
      />
    </div>
  );
}

function TournamentModal({
  mode,
  games,
  onClose,
  onSave,
  pending,
}: {
  mode: Mode | null;
  games: Pick<Game, "id" | "title" | "platform">[];
  onClose: () => void;
  onSave: (values: TournamentInput) => Promise<boolean>;
  pending: boolean;
}) {
  const t = mode?.kind === "edit" ? mode.tournament : undefined;
  const [error, setError] = useState("");

  useEffect(() => setError(""), [mode]);

  function defaultStart() {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setHours(18, 0, 0, 0);
    return toLocalInput(d.toISOString());
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const values: TournamentInput = {
      name: String(fd.get("name") ?? ""),
      game_id: fd.get("game_id") ? Number(fd.get("game_id")) : null,
      starts_at: new Date(String(fd.get("starts_at"))).toISOString(),
      entry_fee: Number(fd.get("entry_fee") ?? 0),
      prize_pool: Number(fd.get("prize_pool") ?? 0),
      max_players: Number(fd.get("max_players") ?? 32),
      registered: Number(fd.get("registered") ?? 0),
      format: String(fd.get("format") ?? "Single elimination"),
      status: String(fd.get("status") ?? "draft"),
      description: String(fd.get("description") ?? ""),
    };
    if (values.name.trim().length < 3) {
      setError("Give the tournament a name (3+ characters).");
      return;
    }
    if (Number(values.registered) > Number(values.max_players)) {
      setError("Registered players cannot exceed capacity.");
      return;
    }
    await onSave(values);
  }

  return (
    <Modal
      open={!!mode}
      onClose={onClose}
      title={t ? `Edit ${t.name}` : "Create a tournament"}
      description="Brackets appear on the dashboard and accept walk-in registrations."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" form="tournament-form" loading={pending}>
            {t ? "Save changes" : "Create tournament"}
          </Button>
        </>
      }
    >
      <form id="tournament-form" onSubmit={submit} className="space-y-4">
        {error && (
          <p className="rounded-lg border border-danger/25 bg-danger/[0.08] px-3 py-2 text-xs text-rose-200">
            {error}
          </p>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Tournament name" required className="sm:col-span-2">
            <Input name="name" defaultValue={t?.name} placeholder="Nexus Valorant Cup" required />
          </Field>
          <Field label="Game">
            <Select name="game_id" defaultValue={t?.game_id ?? ""}>
              <option value="">Multi-game event</option>
              {games.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title} · {g.platform}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Format">
            <Select name="format" defaultValue={t?.format ?? FORMATS[0]}>
              {FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Starts at" required>
            <Input
              name="starts_at"
              type="datetime-local"
              defaultValue={t ? toLocalInput(t.starts_at) : defaultStart()}
              required
            />
          </Field>
          <Field label="Status">
            <Select name="status" defaultValue={t?.status ?? "draft"}>
              {TOURNAMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Entry fee (USD)">
            <Input
              name="entry_fee"
              type="number"
              min={0}
              step="0.5"
              defaultValue={t?.entry_fee ?? 10}
            />
          </Field>
          <Field label="Prize pool (USD)">
            <Input
              name="prize_pool"
              type="number"
              min={0}
              step="10"
              defaultValue={t?.prize_pool ?? 500}
            />
          </Field>
          <Field label="Max players">
            <Input
              name="max_players"
              type="number"
              min={2}
              max={512}
              defaultValue={t?.max_players ?? 32}
            />
          </Field>
          <Field label="Already registered">
            <Input
              name="registered"
              type="number"
              min={0}
              defaultValue={t?.registered ?? 0}
            />
          </Field>
        </div>
        <Field label="Description">
          <Textarea
            name="description"
            defaultValue={t?.description}
            placeholder="Check-in rules, map pool, prizing split…"
          />
        </Field>
      </form>
    </Modal>
  );
}
