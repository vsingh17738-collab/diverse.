"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { get, run } from "../db";
import { requireUser } from "../auth";
import { fail, type ActionResult } from "../action-result";
import { BOOKING_STATUSES, PAYMENT_STATUSES } from "../types";

const bookingSchema = z.object({
  member_id: z.coerce.number().int().positive("Select a member."),
  station_id: z.coerce.number().int().positive("Select a station."),
  game_id: z.coerce.number().int().positive().nullable().optional(),
  start_time: z.string().min(1, "Pick a start time."),
  duration: z.coerce.number().int().min(30, "Minimum session is 30 minutes.").max(720),
  players: z.coerce.number().int().min(1).max(8).default(1),
  status: z.enum(BOOKING_STATUSES as [string, ...string[]]).default("upcoming"),
  payment_status: z.enum(PAYMENT_STATUSES as [string, ...string[]]).default("pending"),
  notes: z.string().trim().default(""),
});

export type BookingInput = z.input<typeof bookingSchema>;

function refresh() {
  revalidatePath("/bookings");
  revalidatePath("/dashboard");
  revalidatePath("/stations");
  revalidatePath("/transactions");
  revalidatePath("/members");
}

function syncStation(stationId: number) {
  const active = get<{ c: number }>(
    "SELECT COUNT(*) AS c FROM bookings WHERE station_id = ? AND status = 'active'",
    stationId,
  );
  const station = get<{ status: string }>("SELECT status FROM stations WHERE id = ?", stationId);
  if (!station || station.status === "maintenance") return;
  const nextStatus = (active?.c ?? 0) > 0 ? "occupied" : "available";
  run("UPDATE stations SET status = ? WHERE id = ?", nextStatus, stationId);
}

export async function createBooking(
  input: BookingInput,
): Promise<ActionResult<{ id: number }>> {
  const user = await requireUser();
  try {
    const data = bookingSchema.parse(input);
    const member = get<{ name: string; status: string }>(
      "SELECT name, status FROM members WHERE id = ?",
      data.member_id,
    );
    if (!member) return { ok: false, error: "Member not found." };
    if (member.status === "banned") {
      return { ok: false, error: "This member is banned and cannot book." };
    }
    const station = get<{ hourly_rate: number; name: string }>(
      "SELECT hourly_rate, name FROM stations WHERE id = ?",
      data.station_id,
    );
    if (!station) return { ok: false, error: "Station not found." };

    const start = new Date(data.start_time);
    if (Number.isNaN(start.getTime())) return { ok: false, error: "Invalid start time." };
    const end = new Date(start.getTime() + data.duration * 60000);
    const amount = Math.round((data.duration / 60) * station.hourly_rate * 100) / 100;

    const result = run(
      `INSERT INTO bookings (member_id, station_id, game_id, start_time, end_time, status, players,
        total_amount, payment_status, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      data.member_id,
      data.station_id,
      data.game_id ?? null,
      start.toISOString(),
      end.toISOString(),
      data.status,
      data.players,
      amount,
      data.payment_status,
      data.notes,
      new Date().toISOString(),
    );

    if (data.payment_status === "paid") {
      run(
        `INSERT INTO transactions (member_id, type, amount, method, status, reference, description, created_at)
         VALUES (?, 'booking', ?, 'wallet', 'paid', ?, ?, ?)`,
        data.member_id,
        amount,
        `TXN-${Math.floor(Math.random() * 900000 + 100000)}`,
        `Booking · ${station.name} · ${data.duration}min by ${user.name}`,
        new Date().toISOString(),
      );
    }
    syncStation(data.station_id);
    refresh();
    return {
      ok: true,
      data: { id: result.lastInsertRowid },
      message: "Booking created",
    };
  } catch (error) {
    return fail(error);
  }
}

export async function updateBooking(
  id: number,
  input: BookingInput,
): Promise<ActionResult> {
  await requireUser();
  try {
    const data = bookingSchema.parse(input);
    const existing = get<{ station_id: number; payment_status: string }>(
      "SELECT station_id, payment_status FROM bookings WHERE id = ?",
      id,
    );
    if (!existing) return { ok: false, error: "Booking not found." };
    const station = get<{ hourly_rate: number }>(
      "SELECT hourly_rate FROM stations WHERE id = ?",
      data.station_id,
    );
    if (!station) return { ok: false, error: "Station not found." };
    const start = new Date(data.start_time);
    if (Number.isNaN(start.getTime())) return { ok: false, error: "Invalid start time." };
    const end = new Date(start.getTime() + data.duration * 60000);
    const amount = Math.round((data.duration / 60) * station.hourly_rate * 100) / 100;

    run(
      `UPDATE bookings SET member_id = ?, station_id = ?, game_id = ?, start_time = ?, end_time = ?,
        status = ?, players = ?, total_amount = ?, payment_status = ?, notes = ? WHERE id = ?`,
      data.member_id,
      data.station_id,
      data.game_id ?? null,
      start.toISOString(),
      end.toISOString(),
      data.status,
      data.players,
      amount,
      data.payment_status,
      data.notes,
      id,
    );
    syncStation(existing.station_id);
    syncStation(data.station_id);
    refresh();
    return { ok: true, message: "Booking updated" };
  } catch (error) {
    return fail(error);
  }
}

export async function setBookingStatus(
  id: number,
  status: string,
): Promise<ActionResult> {
  await requireUser();
  try {
    const parsed = z.enum(BOOKING_STATUSES as [string, ...string[]]).parse(status);
    const booking = get<{ station_id: number; payment_status: string; member_id: number; total_amount: number }>(
      "SELECT station_id, payment_status, member_id, total_amount FROM bookings WHERE id = ?",
      id,
    );
    if (!booking) return { ok: false, error: "Booking not found." };
    run("UPDATE bookings SET status = ? WHERE id = ?", parsed, id);
    if (parsed === "completed" && booking.payment_status === "pending") {
      run("UPDATE bookings SET payment_status = 'paid' WHERE id = ?", id);
      run(
        `INSERT INTO transactions (member_id, type, amount, method, status, reference, description, created_at)
         VALUES (?, 'booking', ?, 'card', 'paid', ?, 'Session completed — payment captured', ?)`,
        booking.member_id,
        booking.total_amount,
        `TXN-${Math.floor(Math.random() * 900000 + 100000)}`,
        new Date().toISOString(),
      );
    }
    syncStation(booking.station_id);
    refresh();
    return { ok: true, message: `Booking marked ${parsed}` };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteBooking(id: number): Promise<ActionResult> {
  await requireUser();
  try {
    const booking = get<{ station_id: number }>(
      "SELECT station_id FROM bookings WHERE id = ?",
      id,
    );
    if (!booking) return { ok: false, error: "Booking not found." };
    run("DELETE FROM bookings WHERE id = ?", id);
    syncStation(booking.station_id);
    refresh();
    return { ok: true, message: "Booking deleted" };
  } catch (error) {
    return fail(error);
  }
}
