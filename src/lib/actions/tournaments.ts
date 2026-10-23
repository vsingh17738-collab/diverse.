"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { get, run } from "../db";
import { requireUser } from "../auth";
import { fail, type ActionResult } from "../action-result";
import { TOURNAMENT_STATUSES } from "../types";

const tournamentSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters."),
  game_id: z.coerce.number().int().positive().nullable().optional(),
  starts_at: z.string().min(1, "Pick a start date."),
  entry_fee: z.coerce.number().min(0, "Entry fee cannot be negative."),
  prize_pool: z.coerce.number().min(0, "Prize pool cannot be negative."),
  max_players: z.coerce.number().int().min(2, "Need at least 2 slots.").max(512),
  registered: z.coerce.number().int().min(0).default(0),
  format: z.string().trim().min(1, "Format is required."),
  status: z.enum(TOURNAMENT_STATUSES as [string, ...string[]]).default("draft"),
  description: z.string().trim().default(""),
});

export type TournamentInput = z.input<typeof tournamentSchema>;

function refresh() {
  revalidatePath("/tournaments");
  revalidatePath("/dashboard");
}

export async function createTournament(
  input: TournamentInput,
): Promise<ActionResult<{ id: number }>> {
  await requireUser();
  try {
    const data = tournamentSchema.parse(input);
    const starts = new Date(data.starts_at);
    if (Number.isNaN(starts.getTime())) return { ok: false, error: "Invalid start date." };
    if (data.registered > data.max_players) {
      return { ok: false, error: "Registered players cannot exceed capacity." };
    }
    const result = run(
      `INSERT INTO tournaments (name, game_id, starts_at, entry_fee, prize_pool, max_players,
        registered, format, status, description, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      data.name,
      data.game_id ?? null,
      starts.toISOString(),
      data.entry_fee,
      data.prize_pool,
      data.max_players,
      data.registered,
      data.format,
      data.status,
      data.description,
      new Date().toISOString(),
    );
    refresh();
    return { ok: true, data: { id: result.lastInsertRowid }, message: "Tournament created" };
  } catch (error) {
    return fail(error);
  }
}

export async function updateTournament(
  id: number,
  input: TournamentInput,
): Promise<ActionResult> {
  await requireUser();
  try {
    const data = tournamentSchema.parse(input);
    if (!get("SELECT id FROM tournaments WHERE id = ?", id)) {
      return { ok: false, error: "Tournament not found." };
    }
    if (data.registered > data.max_players) {
      return { ok: false, error: "Registered players cannot exceed capacity." };
    }
    const starts = new Date(data.starts_at);
    if (Number.isNaN(starts.getTime())) return { ok: false, error: "Invalid start date." };
    run(
      `UPDATE tournaments SET name = ?, game_id = ?, starts_at = ?, entry_fee = ?, prize_pool = ?,
        max_players = ?, registered = ?, format = ?, status = ?, description = ? WHERE id = ?`,
      data.name,
      data.game_id ?? null,
      starts.toISOString(),
      data.entry_fee,
      data.prize_pool,
      data.max_players,
      data.registered,
      data.format,
      data.status,
      data.description,
      id,
    );
    refresh();
    return { ok: true, message: "Tournament updated" };
  } catch (error) {
    return fail(error);
  }
}

export async function setTournamentStatus(
  id: number,
  status: string,
): Promise<ActionResult> {
  await requireUser();
  try {
    const parsed = z.enum(TOURNAMENT_STATUSES as [string, ...string[]]).parse(status);
    run("UPDATE tournaments SET status = ? WHERE id = ?", parsed, id);
    refresh();
    return { ok: true, message: `Tournament marked ${parsed}` };
  } catch (error) {
    return fail(error);
  }
}

export async function registerPlayer(id: number): Promise<ActionResult> {
  await requireUser();
  try {
    const t = get<{ registered: number; max_players: number; status: string }>(
      "SELECT registered, max_players, status FROM tournaments WHERE id = ?",
      id,
    );
    if (!t) return { ok: false, error: "Tournament not found." };
    if (t.registered >= t.max_players) {
      return { ok: false, error: "This bracket is full." };
    }
    run("UPDATE tournaments SET registered = registered + 1 WHERE id = ?", id);
    refresh();
    return { ok: true, message: "Player registered" };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteTournament(id: number): Promise<ActionResult> {
  await requireUser();
  try {
    const t = get<{ name: string }>("SELECT name FROM tournaments WHERE id = ?", id);
    if (!t) return { ok: false, error: "Tournament not found." };
    run("DELETE FROM tournaments WHERE id = ?", id);
    refresh();
    return { ok: true, message: `${t.name} deleted` };
  } catch (error) {
    return fail(error);
  }
}
