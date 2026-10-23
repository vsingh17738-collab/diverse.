"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Copy,
  Gamepad2,
  Layers,
  Pencil,
  Plus,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Toolbar, FilterSelect } from "@/components/ui/toolbar";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { useServerAction } from "@/lib/use-server-action";
import { createGame, deleteGame, updateGame, type GameInput } from "@/lib/actions/games";
import { GAME_STATUSES, GENRES, PLATFORMS, type Game, type GameStatus } from "@/lib/types";
import { cn, number } from "@/lib/utils";

type Mode = { kind: "create" } | { kind: "edit"; game: Game };

const ACCENTS = ["#8b5cf6", "#22d3ee", "#f472b6", "#a3e635", "#fbbf24", "#fb7185", "#60a5fa"];

export function GamesView({ initial, autoOpen }: { initial: Game[]; autoOpen?: boolean }) {
  const [rows, setRows] = useState(initial);
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("all");
  const [genre, setGenre] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("title");
  const [mode, setMode] = useState<Mode | null>(null);
  const [toDelete, setToDelete] = useState<Game | null>(null);
  const { execute, pending } = useServerAction();

  useEffect(() => {
    setRows(initial);
  }, [initial]);

  useEffect(() => {
    if (autoOpen) setMode({ kind: "create" });
  }, [autoOpen]);

  const stats = useMemo(
    () => ({
      total: rows.length,
      available: rows.filter((r) => r.status === "available").length,
      copies: rows.reduce((s, r) => s + r.copies, 0),
      genres: new Set(rows.map((r) => r.genre)).size,
    }),
    [rows],
  );

  const filtered = rows
    .filter((r) => {
      const q = search.toLowerCase();
      return (
        (!q ||
          r.title.toLowerCase().includes(q) ||
          r.genre.toLowerCase().includes(q) ||
          r.platform.toLowerCase().includes(q)) &&
        (platform === "all" || r.platform === platform) &&
        (genre === "all" || r.genre === genre) &&
        (status === "all" || r.status === status)
      );
    })
    .sort((a, b) => {
      if (sort === "rating") return b.rating - a.rating;
      if (sort === "copies") return b.copies - a.copies;
      if (sort === "newest") return b.release_year - a.release_year;
      return a.title.localeCompare(b.title);
    });

  async function handleSave(values: GameInput) {
    if (!mode) return false;
    if (mode.kind === "create") {
      const tempId = -Date.now();
      const optimistic: Game = {
        id: tempId,
        title: values.title,
        platform: values.platform,
        genre: values.genre,
        players: values.players ?? "1",
        age_rating: values.age_rating ?? "E",
        rating: Number(values.rating ?? 4.5),
        status: values.status as GameStatus,
        copies: Number(values.copies ?? 1),
        accent: values.accent ?? "#8b5cf6",
        release_year: Number(values.release_year),
        description: values.description ?? "",
        created_at: new Date().toISOString(),
      };
      setRows((r) => [optimistic, ...r]);
      const res = await execute(() => createGame(values));
      if (res?.ok) {
        setRows((r) => r.map((x) => (x.id === tempId ? { ...optimistic, id: res.data!.id } : x)));
        setMode(null);
        return true;
      }
      setRows((r) => r.filter((x) => x.id !== tempId));
      return false;
    }
    const target = mode.game;
    const optimistic: Game = {
      ...target,
      title: values.title,
      platform: values.platform,
      genre: values.genre,
      players: values.players ?? target.players,
      age_rating: values.age_rating ?? target.age_rating,
      rating: Number(values.rating ?? target.rating),
      status: values.status as GameStatus,
      copies: Number(values.copies ?? target.copies),
      accent: values.accent ?? target.accent,
      release_year: Number(values.release_year),
      description: values.description ?? "",
    };
    setRows((r) => r.map((x) => (x.id === target.id ? optimistic : x)));
    const res = await execute(() => updateGame(target.id, values));
    if (res?.ok) {
      setMode(null);
      return true;
    }
    setRows((r) => r.map((x) => (x.id === target.id ? target : x)));
    return false;
  }

  async function handleDelete() {
    if (!toDelete) return;
    const snapshot = rows;
    const target = toDelete;
    setRows((r) => r.filter((x) => x.id !== target.id));
    const res = await execute(() => deleteGame(target.id));
    if (!res?.ok) setRows(snapshot);
    setToDelete(null);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Operations"
        title="Game library"
        description={`${stats.total} titles · ${number(stats.copies)} copies in rotation across ${stats.genres} genres.`}
        actions={
          <Button onClick={() => setMode({ kind: "create" })}>
            <Plus className="h-4 w-4" /> Add game
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Titles", value: stats.total, icon: Layers, tone: "text-violet-soft" },
          { label: "Available", value: stats.available, icon: Sparkles, tone: "text-lime" },
          { label: "Copies", value: stats.copies, icon: Copy, tone: "text-cyan" },
          { label: "Genres", value: stats.genres, icon: Gamepad2, tone: "text-pink" },
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
        placeholder="Search titles, genres, platforms…"
        filters={
          <>
            <FilterSelect
              label="Platform"
              value={platform}
              onChange={setPlatform}
              options={PLATFORMS.map((p) => ({ value: p, label: p }))}
            />
            <FilterSelect
              label="Genre"
              value={genre}
              onChange={setGenre}
              options={GENRES.map((g) => ({ value: g, label: g }))}
            />
            <FilterSelect
              label="Status"
              value={status}
              onChange={setStatus}
              options={GAME_STATUSES.map((s) => ({ value: s, label: s }))}
            />
          </>
        }
        right={
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort games"
            className="select w-auto py-2 text-xs"
          >
            <option value="title">Sort: A–Z</option>
            <option value="rating">Sort: Top rated</option>
            <option value="copies">Sort: Most copies</option>
            <option value="newest">Sort: Newest</option>
          </select>
        }
      />

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Gamepad2}
            title={rows.length === 0 ? "Your library is empty" : "No games match"}
            description={
              rows.length === 0
                ? "Add the titles you run on the floor so staff can attach them to bookings."
                : "Try clearing the filters or searching for a different title."
            }
            action={
              rows.length === 0 ? (
                <Button onClick={() => setMode({ kind: "create" })}>
                  <Plus className="h-4 w-4" /> Add game
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearch("");
                    setPlatform("all");
                    setGenre("all");
                    setStatus("all");
                  }}
                >
                  Clear filters
                </Button>
              )
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((g, i) => (
            <div
              key={g.id}
              className={cn(
                "card card-hover group relative overflow-hidden",
                g.id < 0 && "animate-pulse opacity-70",
              )}
              style={{ animation: `fade-up 0.4s ${Math.min(i, 10) * 0.03}s both` }}
            >
              <div
                className="absolute inset-x-0 top-0 h-[3px]"
                style={{ background: `linear-gradient(90deg, ${g.accent}, transparent)` }}
              />
              <div
                className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-[0.10] blur-2xl transition-opacity group-hover:opacity-20"
                style={{ background: g.accent }}
              />
              <div className="relative p-4">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl border text-[13px] font-bold"
                    style={{
                      borderColor: `${g.accent}33`,
                      background: `${g.accent}14`,
                      color: g.accent,
                    }}
                  >
                    {g.title.slice(0, 2).toUpperCase()}
                  </span>
                  <Badge tone={g.status}>{g.status}</Badge>
                </div>

                <h3 className="truncate text-[14px] font-semibold tracking-tight text-white">
                  {g.title}
                </h3>
                <p className="mt-0.5 text-[11px] text-muted">
                  {g.platform} · {g.genre} · {g.release_year}
                </p>

                <p className="mt-2 line-clamp-2 min-h-[30px] text-[11px] leading-relaxed text-white/35">
                  {g.description || "No description yet."}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-md border border-white/[0.07] bg-white/[0.03] px-1.5 py-0.5 text-[10px] font-medium text-white/50">
                    {g.players} players
                  </span>
                  <span className="rounded-md border border-white/[0.07] bg-white/[0.03] px-1.5 py-0.5 text-[10px] font-medium text-white/50">
                    Rated {g.age_rating}
                  </span>
                  <span className="rounded-md border border-white/[0.07] bg-white/[0.03] px-1.5 py-0.5 text-[10px] font-medium text-white/50">
                    {g.copies} copies
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-white/[0.05] pt-3">
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-amber">
                    <Star className="h-3 w-3 fill-amber" /> {g.rating.toFixed(1)}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setMode({ kind: "edit", game: g })}
                      className="icon-btn h-7 w-7"
                      aria-label={`Edit ${g.title}`}
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => setToDelete(g)}
                      className="icon-btn h-7 w-7 hover:border-danger/30 hover:text-danger"
                      aria-label={`Delete ${g.title}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <GameModal mode={mode} pending={pending} onClose={() => setMode(null)} onSave={handleSave} />
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        pending={pending}
        title="Remove game?"
        description={`"${toDelete?.title ?? "This game"}" will be removed from the library. Existing bookings will keep their history but lose the title link.`}
        confirmLabel="Remove game"
      />
    </div>
  );
}

function GameModal({
  mode,
  onClose,
  onSave,
  pending,
}: {
  mode: Mode | null;
  onClose: () => void;
  onSave: (values: GameInput) => Promise<boolean>;
  pending: boolean;
}) {
  const game = mode?.kind === "edit" ? mode.game : undefined;
  const [accent, setAccent] = useState(game?.accent ?? ACCENTS[0]);
  const [error, setError] = useState("");

  useEffect(() => {
    setAccent(game?.accent ?? ACCENTS[Math.floor(Math.random() * ACCENTS.length)]);
    setError("");
  }, [mode, game?.accent]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const values: GameInput = {
      title: String(fd.get("title") ?? ""),
      platform: String(fd.get("platform") ?? "PC"),
      genre: String(fd.get("genre") ?? "FPS"),
      players: String(fd.get("players") ?? "1"),
      age_rating: String(fd.get("age_rating") ?? "E"),
      rating: Number(fd.get("rating") ?? 4.5),
      status: String(fd.get("status") ?? "available"),
      copies: Number(fd.get("copies") ?? 1),
      accent,
      release_year: Number(fd.get("release_year") ?? new Date().getFullYear()),
      description: String(fd.get("description") ?? ""),
    };
    if (values.title.trim().length < 2) {
      setError("Enter a game title.");
      return;
    }
    await onSave(values);
  }

  return (
    <Modal
      open={!!mode}
      onClose={onClose}
      title={game ? `Edit ${game.title}` : "Add a game"}
      description="Titles appear in the booking picker and the library grid."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" form="game-form" loading={pending}>
            {game ? "Save changes" : "Add game"}
          </Button>
        </>
      }
    >
      <form id="game-form" onSubmit={submit} className="space-y-4">
        {error && (
          <p className="rounded-lg border border-danger/25 bg-danger/[0.08] px-3 py-2 text-xs text-rose-200">
            {error}
          </p>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Title" required className="sm:col-span-2">
            <Input name="title" defaultValue={game?.title} placeholder="Valorant" required />
          </Field>
          <Field label="Platform">
            <Select name="platform" defaultValue={game?.platform ?? "PC"}>
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Genre">
            <Select name="genre" defaultValue={game?.genre ?? "FPS"}>
              {GENRES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Players">
            <Input name="players" defaultValue={game?.players ?? "1"} placeholder="5v5" />
          </Field>
          <Field label="Age rating">
            <Select name="age_rating" defaultValue={game?.age_rating ?? "E"}>
              {["E", "E10+", "T", "M", "18+"].map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Copies on floor">
            <Input
              name="copies"
              type="number"
              min={0}
              max={500}
              defaultValue={game?.copies ?? 4}
            />
          </Field>
          <Field label="Release year">
            <Input
              name="release_year"
              type="number"
              min={1980}
              max={2030}
              defaultValue={game?.release_year ?? new Date().getFullYear()}
            />
          </Field>
          <Field label="Rating (0–5)">
            <Input
              name="rating"
              type="number"
              min={0}
              max={5}
              step="0.1"
              defaultValue={game?.rating ?? 4.5}
            />
          </Field>
          <Field label="Status">
            <Select name="status" defaultValue={game?.status ?? "available"}>
              {GAME_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Accent colour" hint="Used for the card glow and charts.">
          <div className="flex flex-wrap gap-2">
            {ACCENTS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setAccent(c)}
                aria-label={`Use colour ${c}`}
                className={cn(
                  "h-8 w-8 rounded-lg border-2 transition-transform",
                  accent === c ? "scale-110 border-white" : "border-transparent opacity-70 hover:opacity-100",
                )}
                style={{ background: c }}
              />
            ))}
          </div>
        </Field>

        <Field label="Description">
          <Textarea
            name="description"
            defaultValue={game?.description}
            placeholder="Why players love it, special rules, controller needs…"
          />
        </Field>
      </form>
    </Modal>
  );
}
