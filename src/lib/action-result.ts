import { ZodError } from "zod";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string };

export function fail(error: unknown): { ok: false; error: string } {
  if (error instanceof ZodError) {
    const issue = error.issues[0];
    const field = issue?.path?.join(".");
    return {
      ok: false,
      error: field ? `${field}: ${issue.message}` : (issue?.message ?? "Invalid input."),
    };
  }
  if (error instanceof Error) {
    if (error.message.includes("UNIQUE constraint failed")) {
      return { ok: false, error: "That record already exists." };
    }
    return { ok: false, error: error.message };
  }
  return { ok: false, error: "Something went wrong. Please try again." };
}
