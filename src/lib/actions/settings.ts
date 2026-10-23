"use server";

import { revalidatePath } from "next/cache";
import { db } from "../db";
import { requireUser } from "../auth";
import { resetDatabase } from "../seed";
import { fail, type ActionResult } from "../action-result";

export async function resetDemoData(): Promise<ActionResult> {
  await requireUser();
  try {
    resetDatabase(db);
    revalidatePath("/", "layout");
    return { ok: true, message: "Demo data regenerated" };
  } catch (error) {
    return fail(error);
  }
}
