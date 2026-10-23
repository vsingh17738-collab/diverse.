import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { get, run } from "./db";
import type { Role, User } from "./types";

const COOKIE_NAME = "nexus_session";
const MAX_AGE = 60 * 60 * 24 * 7;
const SHORT_AGE = 60 * 60 * 24;

function secret() {
  const value =
    process.env.AUTH_SECRET ?? "nexus-gaming-zone-dev-secret-key-change-me-2026";
  return new TextEncoder().encode(value);
}

export interface SessionPayload {
  uid: number;
  name: string;
  email: string;
  role: Role;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(payload: SessionPayload, remember = true) {
  const maxAge = remember ? MAX_AGE : SHORT_AGE;
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${maxAge}s`)
    .sign(secret());

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (typeof payload.uid !== "number") return null;
    return {
      uid: payload.uid,
      name: String(payload.name ?? ""),
      email: String(payload.email ?? ""),
      role: (payload.role as Role) ?? "staff",
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session) return null;
  const user = get<User>(
    "SELECT id, name, email, role, created_at FROM users WHERE id = ?",
    session.uid,
  );
  return user ?? null;
}

export async function requireUser(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
  role?: Role;
}) {
  const existing = get<{ id: number }>("SELECT id FROM users WHERE email = ?", input.email);
  if (existing) {
    return { ok: false as const, error: "An account with that email already exists." };
  }
  const result = run(
    "INSERT INTO users (name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)",
    input.name,
    input.email,
    await hashPassword(input.password),
    input.role ?? "manager",
    new Date().toISOString(),
  );
  return {
    ok: true as const,
    user: {
      uid: result.lastInsertRowid,
      name: input.name,
      email: input.email,
      role: input.role ?? "manager",
    },
  };
}
