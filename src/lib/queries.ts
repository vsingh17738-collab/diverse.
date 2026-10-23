import "server-only";
import { all, get } from "./db";
import type {
  ActivityItem,
  Booking,
  DashboardStats,
  Game,
  Member,
  Station,
  Tournament,
  Transaction,
} from "./types";
import { formatDate } from "./utils";

export function getStations(): Station[] {
  return all<Station>(
    `SELECT * FROM stations ORDER BY
      CASE kind WHEN 'PC' THEN 1 WHEN 'Console' THEN 2 WHEN 'VR' THEN 3 WHEN 'Racing' THEN 4 ELSE 5 END,
      name`,
  );
}

export function getGames(): Game[] {
  return all<Game>("SELECT * FROM games ORDER BY title");
}

export function getMembers(): Member[] {
  return all<Member>(
    `SELECT m.*,
       COALESCE((SELECT SUM(t.amount) FROM transactions t WHERE t.member_id = m.id AND t.status = 'paid'), 0) AS total_spent,
       COALESCE((SELECT COUNT(*) FROM bookings b WHERE b.member_id = m.id), 0) AS bookings_count
     FROM members m
     ORDER BY m.joined_at DESC`,
  );
}

export function getBookings(): Booking[] {
  return all<Booking>(
    `SELECT b.*, m.name AS member_name, m.tier AS member_tier, m.avatar_color AS member_color,
       s.name AS station_name, s.kind AS station_kind, g.title AS game_title
     FROM bookings b
     JOIN members m ON m.id = b.member_id
     JOIN stations s ON s.id = b.station_id
     LEFT JOIN games g ON g.id = b.game_id
     ORDER BY b.start_time DESC`,
  );
}

export function getTournaments(): Tournament[] {
  return all<Tournament>(
    `SELECT t.*, g.title AS game_title, g.accent AS game_accent
     FROM tournaments t
     LEFT JOIN games g ON g.id = t.game_id
     ORDER BY t.starts_at DESC`,
  );
}

export function getTransactions(): Transaction[] {
  return all<Transaction>(
    `SELECT t.*, m.name AS member_name, m.avatar_color AS member_color, m.tier AS member_tier
     FROM transactions t
     JOIN members m ON m.id = t.member_id
     ORDER BY t.created_at DESC
     LIMIT 400`,
  );
}

export function getMemberOptions() {
  return all<{ id: number; name: string; tier: string; avatar_color: string; status: string }>(
    "SELECT id, name, tier, avatar_color, status FROM members WHERE status != 'banned' ORDER BY name",
  );
}

export function getStationOptions() {
  return all<{ id: number; name: string; kind: string; hourly_rate: number; status: string }>(
    "SELECT id, name, kind, hourly_rate, status FROM stations ORDER BY name",
  );
}

export function getGameOptions() {
  return all<{ id: number; title: string; platform: string }>(
    "SELECT id, title, platform FROM games WHERE status = 'available' ORDER BY title",
  );
}

export interface RevenuePoint {
  date: string;
  label: string;
  revenue: number;
  bookings: number;
}

export interface DashboardData {
  stats: DashboardStats;
  revenue: RevenuePoint[];
  peakHours: { hour: number; sessions: number }[];
  kindMix: { kind: string; count: number; color: string }[];
  todayBookings: Booking[];
  activity: ActivityItem[];
  topGames: { title: string; accent: string; sessions: number }[];
  upcoming: Tournament[];
  memberGrowth: { label: string; members: number }[];
}

const KIND_COLORS: Record<string, string> = {
  PC: "#8b5cf6",
  Console: "#22d3ee",
  VR: "#f472b6",
  Racing: "#34d399",
  Retro: "#fbbf24",
};

export function getDashboardData(): DashboardData {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setUTCHours(0, 0, 0, 0);
  const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
  const monthAgo = new Date(startOfToday.getTime() - 29 * 86400000);

  const revenueToday =
    get<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM transactions
       WHERE status = 'paid' AND created_at >= ?`,
      startOfToday.toISOString(),
    )?.total ?? 0;

  const revenueYesterday =
    get<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM transactions
       WHERE status = 'paid' AND created_at >= ? AND created_at < ?`,
      startOfYesterday.toISOString(),
      startOfToday.toISOString(),
    )?.total ?? 0;

  const revenueMonth =
    get<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM transactions
       WHERE status = 'paid' AND created_at >= ?`,
      monthAgo.toISOString(),
    )?.total ?? 0;

  const activeSessions =
    get<{ c: number }>("SELECT COUNT(*) AS c FROM bookings WHERE status = 'active'")?.c ?? 0;

  const totalStations = get<{ c: number }>("SELECT COUNT(*) AS c FROM stations")?.c ?? 0;

  const occupiedStations =
    get<{ c: number }>(
      "SELECT COUNT(*) AS c FROM stations WHERE status IN ('occupied','reserved')",
    )?.c ?? 0;

  const bookingsToday =
    get<{ c: number }>(
      "SELECT COUNT(*) AS c FROM bookings WHERE date(start_time) = date(?)",
      now.toISOString(),
    )?.c ?? 0;

  const bookingsYesterday =
    get<{ c: number }>(
      "SELECT COUNT(*) AS c FROM bookings WHERE date(start_time) = date(?)",
      startOfYesterday.toISOString(),
    )?.c ?? 0;

  const totalMembers = get<{ c: number }>("SELECT COUNT(*) AS c FROM members")?.c ?? 0;

  const newMembersMonth =
    get<{ c: number }>(
      "SELECT COUNT(*) AS c FROM members WHERE joined_at >= ?",
      monthAgo.toISOString(),
    )?.c ?? 0;

  const avgSessionMinutes =
    get<{ avg: number }>(
      `SELECT COALESCE(AVG((julianday(end_time) - julianday(start_time)) * 1440), 0) AS avg
       FROM bookings WHERE status IN ('completed','active')`,
    )?.avg ?? 0;

  const utilStationCount =
    get<{ c: number }>(
      "SELECT COUNT(*) AS c FROM stations WHERE status != 'maintenance'",
    )?.c ?? 0;

  const stats: DashboardStats = {
    revenueToday,
    revenueYesterday,
    revenueMonth,
    activeSessions,
    totalStations,
    occupiedStations,
    bookingsToday,
    bookingsYesterday,
    totalMembers,
    newMembersMonth,
    avgSessionMinutes: Math.round(avgSessionMinutes),
    utilization: utilStationCount ? (occupiedStations / utilStationCount) * 100 : 0,
  };

  /* 14-day revenue series */
  const rawRevenue = all<{ day: string; revenue: number; bookings: number }>(
    `SELECT substr(created_at, 1, 10) AS day, COALESCE(SUM(amount), 0) AS revenue, COUNT(*) AS bookings
     FROM transactions
     WHERE status = 'paid' AND created_at >= ?
     GROUP BY day ORDER BY day`,
    new Date(startOfToday.getTime() - 13 * 86400000).toISOString(),
  );
  const revenueMap = new Map(rawRevenue.map((r) => [r.day, r]));
  const revenue: RevenuePoint[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(startOfToday.getTime() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    const found = revenueMap.get(key);
    revenue.push({
      date: key,
      label: formatDate(d.toISOString(), { weekday: "short" }),
      revenue: Math.round((found?.revenue ?? 0) * 100) / 100,
      bookings: found?.bookings ?? 0,
    });
  }

  /* Peak hours across all confirmed bookings */
  const peakRows = all<{ hour: number; sessions: number }>(
    `SELECT CAST(strftime('%H', start_time) AS INTEGER) AS hour, COUNT(*) AS sessions
     FROM bookings WHERE status != 'cancelled'
     GROUP BY hour ORDER BY hour`,
  );
  const peakMap = new Map(peakRows.map((r) => [Number(r.hour), Number(r.sessions)]));
  const peakHours = Array.from({ length: 15 }, (_, i) => {
    const hour = i + 9;
    return { hour, sessions: peakMap.get(hour) ?? 0 };
  });

  const kindRows = all<{ kind: string; count: number }>(
    "SELECT kind, COUNT(*) AS count FROM stations GROUP BY kind",
  );
  const kindMix = kindRows.map((r) => ({
    kind: r.kind,
    count: Number(r.count),
    color: KIND_COLORS[r.kind] ?? "#8b5cf6",
  }));

  const todayBookings = all<Booking>(
    `SELECT b.*, m.name AS member_name, m.tier AS member_tier, m.avatar_color AS member_color,
       s.name AS station_name, s.kind AS station_kind, g.title AS game_title
     FROM bookings b
     JOIN members m ON m.id = b.member_id
     JOIN stations s ON s.id = b.station_id
     LEFT JOIN games g ON g.id = b.game_id
     WHERE date(b.start_time) = date(?)
     ORDER BY b.start_time ASC`,
    now.toISOString(),
  );

  const recentTx = all<Transaction>(
    `SELECT t.*, m.name AS member_name, m.avatar_color AS member_color, m.tier AS member_tier
     FROM transactions t JOIN members m ON m.id = t.member_id
     ORDER BY t.created_at DESC LIMIT 5`,
  );
  const recentBookings = all<Booking>(
    `SELECT b.*, m.name AS member_name, m.avatar_color AS member_color, s.name AS station_name
     FROM bookings b JOIN members m ON m.id = b.member_id JOIN stations s ON s.id = b.station_id
     ORDER BY b.created_at DESC LIMIT 3`,
  );
  const newMembers = all<Member>(
    "SELECT * FROM members ORDER BY joined_at DESC LIMIT 2",
  );

  const activity: ActivityItem[] = [
    ...recentTx.map((t) => ({
      id: `txn-${t.id}`,
      kind: "transaction" as const,
      title: `${t.member_name} · ${t.description}`,
      detail: `${t.method.toUpperCase()} · ${t.type.replace("_", " ")}`,
      amount: t.amount,
      at: t.created_at,
      color: t.member_color ?? "#8b5cf6",
    })),
    ...recentBookings.map((b) => ({
      id: `booking-${b.id}`,
      kind: "booking" as const,
      title: `${b.member_name} booked ${b.station_name}`,
      detail: `${formatDate(b.start_time)} · ${b.game_title ?? "Open play"}`,
      at: b.created_at,
      color: b.member_color ?? "#22d3ee",
    })),
    ...newMembers.map((m) => ({
      id: `member-${m.id}`,
      kind: "member" as const,
      title: `${m.name} joined the zone`,
      detail: `${m.tier} membership`,
      at: m.joined_at,
      color: m.avatar_color,
    })),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 8);

  const topGames = all<{ title: string; accent: string; sessions: number }>(
    `SELECT g.title, g.accent, COUNT(b.id) AS sessions
     FROM games g JOIN bookings b ON b.game_id = g.id
     GROUP BY g.id ORDER BY sessions DESC LIMIT 5`,
  );

  const upcoming = all<Tournament>(
    `SELECT t.*, g.title AS game_title, g.accent AS game_accent
     FROM tournaments t LEFT JOIN games g ON g.id = t.game_id
     WHERE t.status IN ('open','live','draft') ORDER BY t.starts_at ASC LIMIT 3`,
  );

  const memberGrowth: { label: string; members: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const count =
      get<{ c: number }>(
        "SELECT COUNT(*) AS c FROM members WHERE joined_at < ?",
        end.toISOString(),
      )?.c ?? 0;
    memberGrowth.push({
      label: new Intl.DateTimeFormat("en-US", { month: "short" }).format(start),
      members: count,
    });
  }

  return {
    stats,
    revenue,
    peakHours,
    kindMix,
    todayBookings,
    activity,
    topGames,
    upcoming,
    memberGrowth,
  };
}

export function getUsers() {
  return all<{ id: number; name: string; email: string; role: string; created_at: string }>(
    "SELECT id, name, email, role, created_at FROM users ORDER BY id",
  );
}
