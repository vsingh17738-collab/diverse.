"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { get, run } from "../db";
import { requireUser } from "../auth";
import { fail, type ActionResult } from "../action-result";
import {
  PAYMENT_METHODS,
  TRANSACTION_STATUSES,
  TRANSACTION_TYPES,
} from "../types";

const transactionSchema = z.object({
  member_id: z.coerce.number().int().positive("Select a member."),
  type: z.enum(TRANSACTION_TYPES as [string, ...string[]]),
  amount: z.coerce.number().min(0.01, "Amount must be greater than zero."),
  method: z.enum(PAYMENT_METHODS as [string, ...string[]]),
  status: z.enum(TRANSACTION_STATUSES as [string, ...string[]]).default("paid"),
  description: z.string().trim().default(""),
});

export type TransactionInput = z.input<typeof transactionSchema>;

function refresh() {
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/members");
}

export async function createTransaction(
  input: TransactionInput,
): Promise<ActionResult<{ id: number }>> {
  await requireUser();
  try {
    const data = transactionSchema.parse(input);
    if (!get("SELECT id FROM members WHERE id = ?", data.member_id)) {
      return { ok: false, error: "Member not found." };
    }
    const result = run(
      `INSERT INTO transactions (member_id, type, amount, method, status, reference, description, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      data.member_id,
      data.type,
      data.amount,
      data.method,
      data.status,
      `TXN-${Math.floor(Math.random() * 900000 + 100000)}`,
      data.description,
      new Date().toISOString(),
    );
    if (data.type === "wallet_topup" && data.status === "paid") {
      run(
        "UPDATE members SET wallet_balance = wallet_balance + ? WHERE id = ?",
        data.amount,
        data.member_id,
      );
    }
    refresh();
    return { ok: true, data: { id: result.lastInsertRowid }, message: "Transaction recorded" };
  } catch (error) {
    return fail(error);
  }
}

export async function updateTransactionStatus(
  id: number,
  status: string,
): Promise<ActionResult> {
  await requireUser();
  try {
    const parsed = z.enum(TRANSACTION_STATUSES as [string, ...string[]]).parse(status);
    const t = get<{ status: string; type: string; amount: number; member_id: number }>(
      "SELECT status, type, amount, member_id FROM transactions WHERE id = ?",
      id,
    );
    if (!t) return { ok: false, error: "Transaction not found." };
    run("UPDATE transactions SET status = ? WHERE id = ?", parsed, id);
    if (t.type === "wallet_topup" && t.status === "paid" && parsed === "refunded") {
      run(
        "UPDATE members SET wallet_balance = MAX(0, wallet_balance - ?) WHERE id = ?",
        t.amount,
        t.member_id,
      );
    }
    refresh();
    return { ok: true, message: `Transaction marked ${parsed}` };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteTransaction(id: number): Promise<ActionResult> {
  await requireUser();
  try {
    const t = get<{ reference: string }>(
      "SELECT reference FROM transactions WHERE id = ?",
      id,
    );
    if (!t) return { ok: false, error: "Transaction not found." };
    run("DELETE FROM transactions WHERE id = ?", id);
    refresh();
    return { ok: true, message: `${t.reference} deleted` };
  } catch (error) {
    return fail(error);
  }
}
