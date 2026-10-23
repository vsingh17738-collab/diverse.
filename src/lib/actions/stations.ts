"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { get, run } from "../db";
import { requireUser } from "../auth";
import { fail, type ActionResult } from "../action-result";
import { STATION_KINDS, STATION_STATUSES } from "../types";

const stationSchema = z.object({
  name: z.string().trim().min(2, "Station name must be at least 2 characters."),
  kind: z.enum(STATION_KINDS as [string, ...string[]]),
  zone: z.string().trim().min(1, "Zone is required."),
  specs: z.string().trim().default(""),
  hourly_rate: z.coerce.number().min(0, "Rate cannot be negative.").max(500),
  status: z.enum(STATION_STATUSES as [string, ...string[]]).default("available"),
  rating: z.coerce.number().min(0).max(5).default(4.5),
});

export type StationInput = z.input<typeof stationSchema>;

function refresh() {
  revalidatePath("/stations");
  revalidatePath("/dashboard");
  revalidatePath("/bookings");
}

export async function createStation(input: StationInput): Promise<ActionResult<{ id: number }>> {
  await requireUser();
  try {
    const data = stationSchema.parse(input);
    const result = run(
      `INSERT INTO stations (name, kind, zone, specs, hourly_rate, status, total_hours, rating, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      data.name,
      data.kind,
      data.zone,
      data.specs,
      data.hourly_rate,
      data.status,
      data.rating,
      new Date().toISOString(),
    );
    refresh();
    return { ok: true, data: { id: result.lastInsertRowid }, message: "Station added" };
  } catch (error) {
    return fail(error);
  }
}

export async function updateStation(
  id: number,
  input: StationInput,
): Promise<ActionResult> {
  await requireUser();
  try {
    const data = stationSchema.parse(input);
    if (!get("SELECT id FROM stations WHERE id = ?", id)) {
      return { ok: false, error: "Station not found." };
    }
    run(
      `UPDATE stations SET name = ?, kind = ?, zone = ?, specs = ?, hourly_rate = ?, status = ?, rating = ?
       WHERE id = ?`,
      data.name,
      data.kind,
      data.zone,
      data.specs,
      data.hourly_rate,
      data.status,
      data.rating,
      id,
    );
    refresh();
    return { ok: true, message: "Station updated" };
  } catch (error) {
    return fail(error);
  }
}

export async function setStationStatus(
  id: number,
  status: string,
): Promise<ActionResult> {
  await requireUser();
  try {
    const parsed = z.enum(STATION_STATUSES as [string, ...string[]]).parse(status);
    run("UPDATE stations SET status = ? WHERE id = ?", parsed, id);
    refresh();
    return { ok: true, message: `Station marked ${parsed}` };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteStation(id: number): Promise<ActionResult> {
  await requireUser();
  try {
    const station = get<{ name: string }>("SELECT name FROM stations WHERE id = ?", id);
    if (!station) return { ok: false, error: "Station not found." };
    run("DELETE FROM stations WHERE id = ?", id);
    refresh();
    return { ok: true, message: `${station.name} removed` };
  } catch (error) {
    return fail(error);
  }
}
