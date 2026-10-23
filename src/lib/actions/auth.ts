"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { get, run } from "../db";
import {
  createSession,
  destroySession,
  getSession,
  hashPassword,
  registerUser,
  verifyPassword,
} from "../auth";
import { fail, type ActionResult } from "../action-result";
import type { Role } from "../types";

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name."),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  role: z.enum(["owner", "manager", "staff"]).default("manager"),
});

export async function loginAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  let target = "/dashboard";
  try {
    const data = loginSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
    const user = get<{
      id: number;
      name: string;
      email: string;
      role: Role;
      password_hash: string;
    }>("SELECT * FROM users WHERE lower(email) = lower(?)", data.email);
    if (!user || !(await verifyPassword(data.password, user.password_hash))) {
      return { ok: false, error: "Incorrect email or password." };
    }
    await createSession(
      {
        uid: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      formData.get("remember") === "on",
    );
    const next = String(formData.get("next") ?? "/dashboard");
    target = next.startsWith("/") ? next : "/dashboard";
  } catch (error) {
    return fail(error);
  }
  redirect(target);
}

export async function registerAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  let target = "/dashboard";
  try {
    const data = registerSchema.parse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      role: formData.get("role") ?? "manager",
    });
    const result = await registerUser(data);
    if (!result.ok) return { ok: false, error: result.error };
    await createSession(result.user);
  } catch (error) {
    return fail(error);
  }
  redirect(target);
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name."),
  email: z.string().trim().email("Enter a valid email address."),
});

export async function updateProfile(input: {
  name: string;
  email: string;
}): Promise<ActionResult> {
  try {
    const data = profileSchema.parse(input);
    const session = await getSession();
    if (!session) return { ok: false, error: "You are signed out." };
    const clash = get<{ id: number }>(
      "SELECT id FROM users WHERE lower(email) = lower(?) AND id != ?",
      data.email,
      session.uid,
    );
    if (clash) return { ok: false, error: "Another account already uses that email." };
    run("UPDATE users SET name = ?, email = ? WHERE id = ?", data.name, data.email, session.uid);
    const user = get<{ id: number; name: string; email: string; role: Role }>(
      "SELECT id, name, email, role FROM users WHERE id = ?",
      session.uid,
    );
    if (user) {
      await createSession({
        uid: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    }
    return { ok: true, message: "Profile updated" };
  } catch (error) {
    return fail(error);
  }
}

const passwordSchema = z
  .object({
    current: z.string().min(1, "Enter your current password."),
    next: z.string().min(8, "New password must be at least 8 characters."),
    confirm: z.string(),
  })
  .refine((v) => v.next === v.confirm, {
    message: "New passwords do not match.",
    path: ["confirm"],
  });

export async function changePassword(input: {
  current: string;
  next: string;
  confirm: string;
}): Promise<ActionResult> {
  try {
    const data = passwordSchema.parse(input);
    const session = await getSession();
    if (!session) return { ok: false, error: "You are signed out." };
    const user = get<{ password_hash: string }>(
      "SELECT password_hash FROM users WHERE id = ?",
      session.uid,
    );
    if (!user || !(await verifyPassword(data.current, user.password_hash))) {
      return { ok: false, error: "Current password is incorrect." };
    }
    run(
      "UPDATE users SET password_hash = ? WHERE id = ?",
      await hashPassword(data.next),
      session.uid,
    );
    return { ok: true, message: "Password changed" };
  } catch (error) {
    return fail(error);
  }
}
