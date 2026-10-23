"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { get, run } from "../db";
import { requireUser } from "../auth";
import { fail, type ActionResult } from "../action-result";
import { GAME_STATUSES } from "../types";

const gameSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters."),
  platform: z.string().trim().min(1, "Platform is required."),
  genre: z.string().trim().min(1, "Genre is required."),
  players: z.string().trim().default("1"),
  age_rating: z.string().trim().default("E"),
  rating: z.coerce.number().min(0).max(5).default(4.5),
  status: z.enum(GAME_STATUSES as [string, ...string[]]).default("available"),
  copies: z.coerce.number().int().min(0).max(500).default(1),
  accent: z.string().trim().default("#8b5cf6"),
  release_year: z.coerce.number().int().min(1980).max(2030),
  description: z.string().trim().default(""),
});

export type GameInput = z.input<typeof gameSchema>;

function refresh() {
  revalidatePath("/games");
  revalidatePath("/dashboard");
  revalidatePath("/bookings");
}

export async function createGame(input: GameInput): Promise<ActionResult<{ id: number }>> {
  await requireUser();
  try {
    const data = gameSchema.parse(input);
    const result = run(
      `INSERT INTO games (title, platform, genre, players, age_rating, rating, status, copies, accent, release_year, description, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      data.title,
      data.platform,
      data.genre,
      data.players,
      data.age_rating,
      data.rating,
      data.status,
      data.copies,
      data.accent,
      data.release_year,
      data.description,
      new Date().toISOString(),
    );
    refresh();
    return { ok: true, data: { id: result.lastInsertRowid }, message: "Game added to library" };
  } catch (error) {
    return fail(error);
  }
}

export async function updateGame(id: number, input: GameInput): Promise<ActionResult> {
  await requireUser();
  try {
    const data = gameSchema.parse(input);
    if (!get("SELECT id FROM games WHERE id = ?", id)) {
      return { ok: false, error: "Game not found." };
    }
    run(
      `UPDATE games SET title = ?, platform = ?, genre = ?, players = ?, age_rating = ?, rating = ?,
       status = ?, copies = ?, accent = ?, release_year = ?, description = ? WHERE id = ?`,
      data.title,
      data.platform,
      data.genre,
      data.players,
      data.age_rating,
      data.rating,
      data.status,
      data.copies,
      data.accent,
      data.release_year,
      data.description,
      id,
    );
    refresh();
    return { ok: true, message: "Game updated" };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteGame(id: number): Promise<ActionResult> {
  await requireUser();
  try {
    const game = get<{ title: string }>("SELECT title FROM games WHERE id = ?", id);
    if (!game) return { ok: false, error: "Game not found." };
    run("DELETE FROM games WHERE id = ?", id);
    refresh();
    return { ok: true, message: `${game.title} removed from library` };
  } catch (error) {
    return fail(error);
  }
}
