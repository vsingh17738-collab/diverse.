"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { get, run } from "../db";
import { requireUser } from "../auth";
import { fail, type ActionResult } from "../action-result";
import { MEMBER_STATUSES, MEMBER_TIERS } from "../types";

const memberSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z.string().trim().email("Enter a valid email address."),
  phone: z.string().trim().default(""),
  tier: z.enum(MEMBER_TIERS as [string, ...string[]]).default("Bronze"),
  status: z.enum(MEMBER_STATUSES as [string, ...string[]]).default("active"),
  wallet_balance: z.coerce.number().min(0, "Wallet balance cannot be negative.").default(0),
  notes: z.string().trim().default(""),
});

export type MemberInput = z.input<typeof memberSchema>;

function refresh() {
  revalidatePath("/members");
  revalidatePath("/dashboard");
  revalidatePath("/bookings");
  revalidatePath("/transactions");
}

export async function createMember(
  input: MemberInput,
): Promise<ActionResult<{ id: number }>> {
  await requireUser();
  try {
    const data = memberSchema.parse(input);
    if (get("SELECT id FROM members WHERE email = ?", data.email)) {
      return { ok: false, error: "A member with that email already exists." };
    }
    const colors = ["#8b5cf6", "#22d3ee", "#f472b6", "#34d399", "#fbbf24", "#60a5fa", "#fb7185", "#a3e635"];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const result = run(
      `INSERT INTO members (name, email, phone, tier, status, wallet_balance, joined_at, notes, avatar_color)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      data.name,
      data.email,
      data.phone,
      data.tier,
      data.status,
      data.wallet_balance,
      new Date().toISOString(),
      data.notes,
      color,
    );
    refresh();
    return { ok: true, data: { id: result.lastInsertRowid }, message: "Member added" };
  } catch (error) {
    return fail(error);
  }
}

export async function updateMember(id: number, input: MemberInput): Promise<ActionResult> {
  await requireUser();
  try {
    const data = memberSchema.parse(input);
    if (!get("SELECT id FROM members WHERE id = ?", id)) {
      return { ok: false, error: "Member not found." };
    }
    const clash = get<{ id: number }>(
      "SELECT id FROM members WHERE email = ? AND id != ?",
      data.email,
      id,
    );
    if (clash) return { ok: false, error: "Another member already uses that email." };
    run(
      `UPDATE members SET name = ?, email = ?, phone = ?, tier = ?, status = ?, wallet_balance = ?, notes = ?
       WHERE id = ?`,
      data.name,
      data.email,
      data.phone,
      data.tier,
      data.status,
      data.wallet_balance,
      data.notes,
      id,
    );
    refresh();
    return { ok: true, message: "Member updated" };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteMember(id: number): Promise<ActionResult> {
  await requireUser();
  try {
    const member = get<{ name: string }>("SELECT name FROM members WHERE id = ?", id);
    if (!member) return { ok: false, error: "Member not found." };
    run("DELETE FROM members WHERE id = ?", id);
    refresh();
    return { ok: true, message: `${member.name} removed` };
  } catch (error) {
    return fail(error);
  }
}

export async function topUpWallet(
  id: number,
  amount: number,
): Promise<ActionResult> {
  const user = await requireUser();
  try {
    const parsed = z.coerce.number().min(1, "Top-up must be at least $1.").max(2000).parse(amount);
    const member = get<{ name: string; wallet_balance: number }>(
      "SELECT name, wallet_balance FROM members WHERE id = ?",
      id,
    );
    if (!member) return { ok: false, error: "Member not found." };
    run(
      "UPDATE members SET wallet_balance = wallet_balance + ? WHERE id = ?",
      parsed,
      id,
    );
    run(
      `INSERT INTO transactions (member_id, type, amount, method, status, reference, description, created_at)
       VALUES (?, 'wallet_topup', ?, 'card', 'paid', ?, ?, ?)`,
      id,
      parsed,
      `TXN-${Math.floor(Math.random() * 900000 + 100000)}`,
      `Wallet top-up by ${user.name}`,
      new Date().toISOString(),
    );
    refresh();
    return { ok: true, message: `$${parsed.toFixed(2)} added to ${member.name}'s wallet` };
  } catch (error) {
    return fail(error);
  }
}
