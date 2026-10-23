# Nexus Gaming Zone

A full-stack operations dashboard for a gaming zone / esports café — station
control, bookings, game library, members and wallets, tournaments and a full
revenue ledger, all backed by a persistent SQLite database.

Built with **Next.js 15 (App Router)**, **React 19**, **TypeScript**,
**Tailwind CSS v4**, and **SQLite via Node's built-in `node:sqlite`** — so there
are no native build steps and no external services to configure.

![stack](https://img.shields.io/badge/Next.js-15-black) ![db](https://img.shields.io/badge/SQLite-persistent-22d3ee)

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
```

The database is created and seeded automatically on first request
(`data/nexus.db`). Nothing else to configure.

### Demo credentials

| Role  | Email            | Password   |
| ----- | ---------------- | ---------- |
| Owner | `admin@nexus.gg` | `demo1234` |
| Staff | `staff@nexus.gg` | `demo1234` |

The login screen prefills the owner account and has an **Autofill** shortcut.
You can also create a new account from `/register` (owner / manager / staff).

---

## What's inside

### Authentication
- Email + password with **bcrypt** hashing, **JWT sessions** (`jose`) stored in an
  httpOnly cookie, 7-day (or 1-day) expiry, middleware-protected routes.
- Sign in, sign up with role selection, sign out, profile updates, password
  changes. All server actions re-validate the session.

### Dashboard
- KPI cards with deltas vs yesterday and 8-point sparklines.
- 14-day revenue/booking area chart with hover tooltips.
- Station mix donut, floor utilization meter, peak-hours bar chart.
- Live schedule with progress bars that refresh every 30s, activity feed,
  most-played titles and upcoming brackets.

### Core resources (full CRUD, optimistic UI)
| Resource | Highlights |
| -------- | ---------- |
| **Stations** | 5 hardware kinds, zones, hourly rates, live status, quick status switching, per-card edit/delete |
| **Bookings** | Member + station + game selection, duration → auto-priced total, start/complete/cancel flow, payment tracking, auto station occupancy |
| **Game library** | Platform/genre filters, copies, age ratings, accent colours, sortable grid |
| **Members** | Tiers, wallet balances, ban states, top-ups (writes a ledger entry), profile modal, lifetime spend |
| **Tournaments** | Brackets with capacity + fill bars, one-click player registration, draft → open → live → completed lifecycle |
| **Transactions** | Revenue ledger, manual payments, refund/fail transitions, wallet top-ups credit balances |
| **Settings** | Profile, password, team list, live row counts, and one-click demo-data reset |

### UX details
- Sidebar navigation (grouped, active rail), mobile drawer, sticky top bar.
- ⌘K / Ctrl-K command palette for jumping anywhere or starting a create flow.
- Toasts for every mutation, inline validation errors, confirm dialogs for
  destructive actions.
- Skeleton `loading.tsx` for every route, bespoke empty states for both
  "no data" and "no results", error boundary with retry.
- Optimistic create/update/delete for all resources with automatic rollback.
- Responsive from 320px: tables collapse into cards, modals become sheets.

---

## Data model

```
users        members        stations       games
             │  │  │       │              │
             │  └──┴───────┴── bookings ──┘
             │                 │
             ├── transactions  └── (member, station, game)
             └── tournaments ── game
```

Foreign keys cascade on delete (deleting a member removes their bookings and
transactions). Station status is kept in sync with live bookings; completing a
session with a pending payment captures it into the ledger.

### Seed data
On first boot the app inserts a deterministic, realistic dataset:

- 26 members across Bronze → Platinum (wallets, notes, join dates)
- 18 stations across PC Arena, Console Lounge, Immersive Lab, Sim Speedway,
  Retro Corner and Creator Studio
- 24 games with covers-by-accent, ratings and copy counts
- ~94 bookings spanning two weeks back and one week forward (finished, live,
  upcoming and cancelled), 6 tournaments (live/open/draft/completed) and a
  30-day transaction history with ~172 entries

Reset any time with **Settings → Reset demo data** or:

```bash
npm run db:reset     # delete the DB, restart dev to reseed
```

---

## Project structure

```
src/
├── app/
│   ├── (app)/                 # authenticated shell + dashboard & resources
│   │   ├── dashboard/         # KPIs, charts, live schedule
│   │   ├── stations|bookings|games|members|tournaments|transactions|settings/
│   │   └── layout.tsx         # sidebar + top bar + command palette
│   ├── (auth)/login|register/ # split-screen auth pages
│   ├── layout.tsx             # root layout + toast provider
│   └── not-found.tsx
├── components/
│   ├── ui/                    # design system: button, modal, badge, charts…
│   ├── layout/                # app shell, command palette
│   └── <resource>/            # view components with optimistic CRUD
├── lib/
│   ├── db.ts                  # node:sqlite connection + schema + helpers
│   ├── seed.ts                # deterministic demo dataset
│   ├── queries.ts             # read model (dashboard aggregates, lists)
│   ├── actions/               # server actions per resource (zod validated)
│   ├── auth.ts                # sessions, hashing, guards
│   └── use-server-action.ts   # pending + toast wrapper
├── middleware.ts              # route protection & redirects
└── scripts/reset-db.mjs
```

## Scripts

```bash
npm run dev        # development server on 0.0.0.0:3000
npm run build      # production build
npm run start      # production server
npm run db:reset   # wipe the SQLite file (reseeds on next boot)
```

## Notes

- `node:sqlite` ships with Node 22 — no native compilation required.
- Query helpers normalise rows to plain objects so they can cross the
  server → client boundary safely.
- All timestamps are stored and rendered in UTC for deterministic hydration.
- `AUTH_SECRET` can be set to override the development signing key.
