"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, CircuitBoard, Eye, EyeOff, Loader2, Lock, Mail, User } from "lucide-react";
import { loginAction, registerAction } from "@/lib/actions/auth";
import type { ActionResult } from "@/lib/action-result";
import { cn } from "@/lib/utils";

function ErrorBanner({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-danger/25 bg-danger/[0.08] p-3 text-xs text-rose-200 animate-[fade-in_0.2s_ease]">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
      <span>{message}</span>
    </div>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState<ActionResult | undefined, FormData>(
    loginAction,
    undefined,
  );
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("admin@nexus.gg");
  const [password, setPassword] = useState("demo1234");

  return (
    <div className="animate-[fade-up_0.4s_ease]">
      <div className="mb-8 flex items-center gap-3 lg:hidden">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet to-[#5b21b6]">
          <CircuitBoard className="h-5 w-5 text-white" />
        </span>
        <div>
          <p className="text-base font-bold leading-none text-white">NEXUS</p>
          <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.22em] text-violet-soft/70">
            Gaming Zone
          </p>
        </div>
      </div>

      <h2 className="text-2xl font-bold tracking-tight text-white">Welcome back</h2>
      <p className="mt-1.5 text-sm text-white/40">
        Sign in to open the control room.
      </p>

      <form action={formAction} className="mt-7 space-y-4">
        <input type="hidden" name="next" value={next ?? "/dashboard"} />
        <ErrorBanner message={state && !state.ok ? state.error : undefined} />

        <div>
          <label htmlFor="email" className="label">
            Email address
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input pl-10"
              placeholder="you@nexus.gg"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="label">
              Password
            </label>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input pl-10 pr-10"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 transition hover:text-white/70"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-xs text-white/45">
          <input
            type="checkbox"
            name="remember"
            defaultChecked
            className="h-3.5 w-3.5 rounded border-white/20 bg-white/5 accent-violet"
          />
          Keep me signed in for 7 days
        </label>

        <button type="submit" disabled={pending} className="btn-primary w-full !py-3">
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
            </>
          ) : (
            <>
              Sign in <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/35">
            Demo credentials
          </p>
          <div className="mt-1.5 flex items-center justify-between gap-3">
            <p className="font-mono text-[11px] text-white/60">
              admin@nexus.gg · demo1234
            </p>
            <button
              type="button"
              onClick={() => {
                setEmail("admin@nexus.gg");
                setPassword("demo1234");
              }}
              className="shrink-0 text-[11px] font-semibold text-violet-soft hover:text-violet"
            >
              Autofill
            </button>
          </div>
        </div>
      </form>

      <p className="mt-6 text-center text-xs text-white/40">
        New to the crew?{" "}
        <Link href="/register" className="font-semibold text-violet-soft hover:text-violet">
          Create an account
        </Link>
      </p>
    </div>
  );
}

export function RegisterForm() {
  const [state, formAction, pending] = useActionState<ActionResult | undefined, FormData>(
    registerAction,
    undefined,
  );
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const strength = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  return (
    <div className="animate-[fade-up_0.4s_ease]">
      <div className="mb-8 flex items-center gap-3 lg:hidden">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet to-[#5b21b6]">
          <CircuitBoard className="h-5 w-5 text-white" />
        </span>
        <div>
          <p className="text-base font-bold leading-none text-white">NEXUS</p>
          <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.22em] text-violet-soft/70">
            Gaming Zone
          </p>
        </div>
      </div>

      <h2 className="text-2xl font-bold tracking-tight text-white">Create your account</h2>
      <p className="mt-1.5 text-sm text-white/40">
        Get manager access to the zone in seconds.
      </p>

      <form action={formAction} className="mt-7 space-y-4">
        <ErrorBanner message={state && !state.ok ? state.error : undefined} />

        <div>
          <label htmlFor="name" className="label">Full name</label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
            <input
              id="name"
              name="name"
              required
              className="input pl-10"
              placeholder="Alex Rivera"
              autoComplete="name"
            />
          </div>
        </div>

        <div>
          <label htmlFor="reg-email" className="label">Work email</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
            <input
              id="reg-email"
              name="email"
              type="email"
              required
              className="input pl-10"
              placeholder="you@nexus.gg"
              autoComplete="email"
            />
          </div>
        </div>

        <div>
          <label htmlFor="role" className="label">Role</label>
          <select id="role" name="role" className="select" defaultValue="manager">
            <option value="manager">Manager — full operations access</option>
            <option value="staff">Staff — bookings & members</option>
            <option value="owner">Owner — everything incl. settings</option>
          </select>
        </div>

        <div>
          <label htmlFor="reg-password" className="label">Password</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
            <input
              id="reg-password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input pl-10 pr-10"
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70"
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="mt-2 flex gap-1">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  i < strength
                    ? strength <= 1
                      ? "bg-danger"
                      : strength === 2
                        ? "bg-amber"
                        : strength === 3
                          ? "bg-cyan"
                          : "bg-lime"
                    : "bg-white/[0.08]",
                )}
              />
            ))}
          </div>
        </div>

        <button type="submit" disabled={pending} className="btn-primary w-full !py-3">
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Creating account…
            </>
          ) : (
            <>
              Create account <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-white/40">
        Already have access?{" "}
        <Link href="/login" className="font-semibold text-violet-soft hover:text-violet">
          Sign in
        </Link>
      </p>
    </div>
  );
}
