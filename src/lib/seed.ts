import type { DatabaseSync } from "node:sqlite";
import bcrypt from "bcryptjs";
import type {
  BookingStatus,
  GameStatus,
  MemberStatus,
  MemberTier,
  PaymentStatus,
  StationKind,
  StationStatus,
  TournamentStatus,
  TransactionType,
} from "./types";

/* Deterministic pseudo-random generator so the demo data is stable across resets. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260214);
const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const between = (min: number, max: number) =>
  Math.round((min + rand() * (max - min)) * 100) / 100;
const intBetween = (min: number, max: number) =>
  Math.floor(min + rand() * (max - min + 1));

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => d.toISOString();
const addMinutes = (d: Date, m: number) => new Date(d.getTime() + m * 60000);
const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 86400000);
const atUtcHour = (base: Date, hour: number, minute = 0) => {
  const d = new Date(base);
  d.setUTCHours(hour, minute, 0, 0);
  return d;
};

type MemberSeed = {
  name: string;
  tier: MemberTier;
  status: MemberStatus;
  wallet: number;
  joinedDaysAgo: number;
  notes?: string;
};

const MEMBERS: MemberSeed[] = [
  { name: "Aarav Mehta", tier: "Platinum", status: "active", wallet: 284.5, joinedDaysAgo: 612, notes: "Founding member. Prefers Rig 01." },
  { name: "Sofia Ramirez", tier: "Gold", status: "active", wallet: 96.25, joinedDaysAgo: 388 },
  { name: "Liam O'Connor", tier: "Silver", status: "active", wallet: 34.0, joinedDaysAgo: 244 },
  { name: "Noor Haddad", tier: "Gold", status: "active", wallet: 128.75, joinedDaysAgo: 301 },
  { name: "Kenji Tanaka", tier: "Bronze", status: "active", wallet: 12.5, joinedDaysAgo: 62 },
  { name: "Amara Okafor", tier: "Platinum", status: "active", wallet: 412.0, joinedDaysAgo: 540, notes: "Team captain — Night Owls." },
  { name: "Diego Fernández", tier: "Silver", status: "active", wallet: 22.4, joinedDaysAgo: 190 },
  { name: "Priya Nair", tier: "Gold", status: "active", wallet: 74.6, joinedDaysAgo: 275 },
  { name: "Ethan Brooks", tier: "Bronze", status: "inactive", wallet: 3.0, joinedDaysAgo: 128 },
  { name: "Yuki Sato", tier: "Silver", status: "active", wallet: 41.8, joinedDaysAgo: 207 },
  { name: "Zara Ali", tier: "Gold", status: "active", wallet: 88.3, joinedDaysAgo: 330 },
  { name: "Marco Rossi", tier: "Bronze", status: "active", wallet: 8.9, joinedDaysAgo: 41 },
  { name: "Chloe Dubois", tier: "Silver", status: "active", wallet: 27.5, joinedDaysAgo: 168 },
  { name: "Rohan Verma", tier: "Platinum", status: "active", wallet: 356.2, joinedDaysAgo: 498 },
  { name: "Isabella Costa", tier: "Gold", status: "active", wallet: 63.4, joinedDaysAgo: 260 },
  { name: "Jamal Carter", tier: "Bronze", status: "banned", wallet: 0, joinedDaysAgo: 92, notes: "Suspended 14 days — repeated no-shows." },
  { name: "Freya Nilsson", tier: "Silver", status: "active", wallet: 19.9, joinedDaysAgo: 149 },
  { name: "Thabo Mokoena", tier: "Bronze", status: "active", wallet: 6.5, joinedDaysAgo: 26 },
  { name: "Hana Kim", tier: "Gold", status: "active", wallet: 112.0, joinedDaysAgo: 286 },
  { name: "Lucas Silva", tier: "Silver", status: "active", wallet: 30.2, joinedDaysAgo: 175 },
  { name: "Aisha Rahman", tier: "Platinum", status: "active", wallet: 521.75, joinedDaysAgo: 455, notes: "Runs the Friday Tekken ladder." },
  { name: "Oliver Novak", tier: "Bronze", status: "active", wallet: 14.0, joinedDaysAgo: 17 },
  { name: "Mei Lin", tier: "Gold", status: "active", wallet: 69.8, joinedDaysAgo: 233 },
  { name: "Karim Benali", tier: "Silver", status: "active", wallet: 25.6, joinedDaysAgo: 158 },
  { name: "Elena Petrova", tier: "Bronze", status: "active", wallet: 4.25, joinedDaysAgo: 9 },
  { name: "Jackson Reed", tier: "Gold", status: "active", wallet: 81.5, joinedDaysAgo: 312 },
];

const STATIONS: Array<{
  name: string;
  kind: StationKind;
  zone: string;
  specs: string;
  rate: number;
  status: StationStatus;
  hours: number;
  rating: number;
}> = [
  { name: "Nexus Rig 01", kind: "PC", zone: "PC Arena", specs: 'RTX 4090 · i9-14900K · 27" 360Hz', rate: 12, status: "occupied", hours: 1842, rating: 4.9 },
  { name: "Nexus Rig 02", kind: "PC", zone: "PC Arena", specs: 'RTX 4080 · i7-14700K · 27" 240Hz', rate: 10, status: "available", hours: 1620, rating: 4.8 },
  { name: "Nexus Rig 03", kind: "PC", zone: "PC Arena", specs: 'RTX 4080 · i7-14700K · 27" 240Hz', rate: 10, status: "occupied", hours: 1544, rating: 4.7 },
  { name: "Nexus Rig 04", kind: "PC", zone: "PC Arena", specs: 'RTX 4070 Ti · i5-14600K · 24" 180Hz', rate: 8, status: "available", hours: 1310, rating: 4.6 },
  { name: "Nexus Rig 05", kind: "PC", zone: "PC Arena", specs: 'RTX 4070 Ti · i5-14600K · 24" 180Hz', rate: 8, status: "reserved", hours: 1288, rating: 4.5 },
  { name: "Nexus Rig 06", kind: "PC", zone: "PC Arena", specs: 'RTX 4070 · Ryzen 7 7800X3D · 24" 165Hz', rate: 8, status: "available", hours: 1190, rating: 4.6 },
  { name: "Console Bay 01", kind: "Console", zone: "Console Lounge", specs: 'PS5 Pro · 65" OLED · DualSense', rate: 7, status: "occupied", hours: 980, rating: 4.8 },
  { name: "Console Bay 02", kind: "Console", zone: "Console Lounge", specs: 'PS5 · 55" 4K · DualSense', rate: 6, status: "available", hours: 902, rating: 4.5 },
  { name: "Console Bay 03", kind: "Console", zone: "Console Lounge", specs: 'Xbox Series X · 55" 4K · Elite pads', rate: 6, status: "available", hours: 860, rating: 4.4 },
  { name: "Console Bay 04", kind: "Console", zone: "Console Lounge", specs: 'Xbox Series X · 55" 4K · Game Pass', rate: 6, status: "maintenance", hours: 744, rating: 4.2 },
  { name: "VR Pod 01", kind: "VR", zone: "Immersive Lab", specs: "Meta Quest 3 · 360° playspace", rate: 15, status: "occupied", hours: 620, rating: 4.9 },
  { name: "VR Pod 02", kind: "VR", zone: "Immersive Lab", specs: "Valve Index · 4 base stations", rate: 15, status: "available", hours: 588, rating: 4.7 },
  { name: "Sim Rig 01", kind: "Racing", zone: "Sim Speedway", specs: "Fanatec DD2 · Triple 1440p · Load cell", rate: 14, status: "reserved", hours: 712, rating: 5.0 },
  { name: "Sim Rig 02", kind: "Racing", zone: "Sim Speedway", specs: "Moza R12 · Triple 1440p · Motion seat", rate: 14, status: "available", hours: 655, rating: 4.8 },
  { name: "Retro Corner 01", kind: "Retro", zone: "Retro Corner", specs: "N64 · PS2 · Dreamcast · CRT", rate: 4, status: "available", hours: 402, rating: 4.6 },
  { name: "Retro Corner 02", kind: "Retro", zone: "Retro Corner", specs: "Arcade cabinet · 60-in-1 board", rate: 4, status: "available", hours: 386, rating: 4.5 },
  { name: "Streaming Suite", kind: "PC", zone: "Creator Studio", specs: "RTX 4080 · Shure MV7 · Elgato 4K60", rate: 18, status: "available", hours: 274, rating: 4.9 },
  { name: "Squad Bench", kind: "Console", zone: "Console Lounge", specs: '5× monitors · Switch dock · Mario Kart', rate: 9, status: "available", hours: 430, rating: 4.7 },
];

const GAMES: Array<{
  title: string;
  platform: string;
  genre: string;
  players: string;
  age: string;
  rating: number;
  status: GameStatus;
  copies: number;
  accent: string;
  year: number;
  description: string;
}> = [
  { title: "Valorant", platform: "PC", genre: "FPS", players: "5v5", age: "T", rating: 4.8, status: "available", copies: 18, accent: "#ff4655", year: 2020, description: "Tactical 5v5 hero shooter — the backbone of our Tuesday night ladder." },
  { title: "Counter-Strike 2", platform: "PC", genre: "FPS", players: "5v5", age: "M", rating: 4.7, status: "available", copies: 18, accent: "#f59e0b", year: 2023, description: "Source 2 refresh of the legendary tactical shooter." },
  { title: "Fortnite", platform: "Multi", genre: "Battle Royale", players: "100", age: "T", rating: 4.4, status: "available", copies: 12, accent: "#8b5cf6", year: 2017, description: "Build, shoot, and survive — cross-play across every station." },
  { title: "Apex Legends", platform: "Multi", genre: "Battle Royale", players: "60", age: "T", rating: 4.5, status: "available", copies: 10, accent: "#ef4444", year: 2019, description: "Squad-based hero battle royale with fluid movement." },
  { title: "League of Legends", platform: "PC", genre: "MOBA", players: "5v5", age: "T", rating: 4.6, status: "available", copies: 18, accent: "#22d3ee", year: 2009, description: "The MOBA standard. Ranked nights every Wednesday." },
  { title: "Dota 2", platform: "PC", genre: "MOBA", players: "5v5", age: "M", rating: 4.3, status: "available", copies: 16, accent: "#b91c1c", year: 2013, description: "Deep, punishing, endlessly rewarding." },
  { title: "EA Sports FC 25", platform: "Multi", genre: "Sports", players: "1v1", age: "E", rating: 4.2, status: "available", copies: 8, accent: "#22c55e", year: 2024, description: "Our most-booked console title on weekends." },
  { title: "NBA 2K25", platform: "Multi", genre: "Sports", players: "1v1", age: "E", rating: 4.1, status: "available", copies: 6, accent: "#f97316", year: 2024, description: "Pick-up runs on Console Bay 03." },
  { title: "Tekken 8", platform: "Multi", genre: "Fighting", players: "1v1", age: "T", rating: 4.7, status: "available", copies: 8, accent: "#a855f7", year: 2024, description: "Friday ladder favourite — Aisha runs the bracket." },
  { title: "Street Fighter 6", platform: "Multi", genre: "Fighting", players: "1v1", age: "T", rating: 4.6, status: "available", copies: 8, accent: "#facc15", year: 2023, description: "Modern controls welcome. Super Art chaos guaranteed." },
  { title: "Mortal Kombat 1", platform: "Multi", genre: "Fighting", players: "1v1", age: "M", rating: 4.3, status: "available", copies: 6, accent: "#dc2626", year: 2023, description: "Kameo fighters and brutal finishers." },
  { title: "Gran Turismo 7", platform: "PS5", genre: "Racing", players: "1-2", age: "E", rating: 4.8, status: "available", copies: 4, accent: "#38bdf8", year: 2022, description: "Sim racing on the Speedway rigs with load-cell pedals." },
  { title: "F1 25", platform: "Multi", genre: "Racing", players: "1-2", age: "E", rating: 4.5, status: "available", copies: 4, accent: "#e11d48", year: 2025, description: "Official F1 sim — hub for our time-attack league." },
  { title: "Assetto Corsa Competizione", platform: "PC", genre: "Racing", players: "1-2", age: "E", rating: 4.7, status: "available", copies: 4, accent: "#16a34a", year: 2018, description: "GT3 racing with full motion-rig support." },
  { title: "Rocket League", platform: "Multi", genre: "Sports", players: "3v3", age: "E", rating: 4.6, status: "available", copies: 10, accent: "#3b82f6", year: 2015, description: "Cars plus football equals pure chaos." },
  { title: "Minecraft", platform: "Multi", genre: "Sandbox", players: "1-8", age: "E", rating: 4.6, status: "available", copies: 12, accent: "#65a30d", year: 2011, description: "Creative servers for the younger crowd." },
  { title: "Grand Theft Auto V", platform: "Multi", genre: "Sandbox", players: "1-4", age: "M", rating: 4.5, status: "available", copies: 10, accent: "#f59e0b", year: 2013, description: "Story mode and RP sessions on request." },
  { title: "Elden Ring", platform: "Multi", genre: "RPG", players: "1", age: "M", rating: 4.9, status: "available", copies: 6, accent: "#ca8a04", year: 2022, description: "Solo sessions from the couch in Console Lounge." },
  { title: "Call of Duty: Black Ops 6", platform: "Multi", genre: "FPS", players: "6v6", age: "M", rating: 4.2, status: "available", copies: 12, accent: "#94a3b8", year: 2024, description: "Omnimovement and Zombies on Game Pass." },
  { title: "Beat Saber", platform: "VR", genre: "Rhythm", players: "1", age: "E", rating: 4.9, status: "available", copies: 4, accent: "#ec4899", year: 2019, description: "Our VR pod opener — always a crowd pleaser." },
  { title: "Super Smash Bros. Ultimate", platform: "Switch", genre: "Fighting", players: "1-8", age: "E", rating: 4.8, status: "available", copies: 4, accent: "#f43f5e", year: 2018, description: "Weekly bracket on the Squad Bench." },
  { title: "Mario Kart 8 Deluxe", platform: "Switch", genre: "Party", players: "1-8", age: "E", rating: 4.7, status: "available", copies: 4, accent: "#ef4444", year: 2017, description: "Best birthday-party booking in the building." },
  { title: "The Legend of Zelda: Tears of the Kingdom", platform: "Switch", genre: "RPG", players: "1", age: "E", rating: 4.9, status: "maintenance", copies: 2, accent: "#84cc16", year: 2023, description: "Cartridge sent for resurfacing — back soon." },
  { title: "Overwatch 2", platform: "Multi", genre: "FPS", players: "5v5", age: "T", rating: 4.0, status: "retired", copies: 0, accent: "#f97316", year: 2022, description: "Retired from the rotation in Q2." },
];

const TOURNAMENTS: Array<{
  name: string;
  game: string;
  daysFromNow: number;
  hour: number;
  fee: number;
  prize: number;
  max: number;
  registered: number;
  format: string;
  status: TournamentStatus;
  description: string;
}> = [
  { name: "Nexus Valorant Cup", game: "Valorant", daysFromNow: 3, hour: 18, fee: 15, prize: 1200, max: 40, registered: 32, format: "Single elimination · BO3", status: "open", description: "5v5 squads from across the city. Check-in 30 minutes before start." },
  { name: "FC 25 Champions Night", game: "EA Sports FC 25", daysFromNow: 1, hour: 19, fee: 10, prize: 600, max: 32, registered: 28, format: "Group stage + knockout", status: "open", description: "1v1 football showdown on the console bays." },
  { name: "Tekken 8 Throwdown", game: "Tekken 8", daysFromNow: 0, hour: 20, fee: 8, prize: 450, max: 24, registered: 24, format: "Double elimination", status: "live", description: "Bracket is live now — finals around 11pm." },
  { name: "CS2 Midnight Madness", game: "Counter-Strike 2", daysFromNow: 6, hour: 22, fee: 12, prize: 900, max: 32, registered: 14, format: "Single elimination · BO1", status: "open", description: "Overnight LAN. Doors stay open until 4am." },
  { name: "GT7 Time Attack", game: "Gran Turismo 7", daysFromNow: -4, hour: 17, fee: 5, prize: 300, max: 20, registered: 19, format: "Time trial", status: "completed", description: "Fastest lap on Deep Forest took home the cash." },
  { name: "Smash Weekly #48", game: "Super Smash Bros. Ultimate", daysFromNow: 8, hour: 18, fee: 0, prize: 150, max: 32, registered: 6, format: "Double elimination", status: "draft", description: "Free entry community bracket — details being finalised." },
];

const TXN_REF = () => `TXN-${Math.floor(rand() * 900000 + 100000)}`;

function insertAll(db: DatabaseSync) {
  const now = new Date();
  const insertUser = db.prepare(
    "INSERT INTO users (name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)",
  );
  const demoHash = bcrypt.hashSync("demo1234", 10);
  insertUser.run("Aisha Rahman", "admin@nexus.gg", demoHash, "owner", iso(addDays(now, -720)));
  insertUser.run("Sam Porter", "staff@nexus.gg", bcrypt.hashSync("demo1234", 10), "staff", iso(addDays(now, -190)));

  const insertMember = db.prepare(
    `INSERT INTO members (name, email, phone, tier, status, wallet_balance, joined_at, notes, avatar_color)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  const memberIds: number[] = [];
  MEMBERS.forEach((m, i) => {
    const slug = m.name.toLowerCase().replace(/[^a-z]+/g, ".");
    const colors = ["#8b5cf6", "#22d3ee", "#f472b6", "#34d399", "#fbbf24", "#60a5fa", "#fb7185", "#a3e635"];
    const res = insertMember.run(
      m.name,
      `${slug}@example.com`,
      `+1 (415) 555-${String(101 + i).padStart(4, "0")}`,
      m.tier,
      m.status,
      m.wallet,
      iso(addDays(now, -m.joinedDaysAgo)),
      m.notes ?? "",
      colors[i % colors.length],
    );
    memberIds.push(Number(res.lastInsertRowid));
  });

  const insertStation = db.prepare(
    `INSERT INTO stations (name, kind, zone, specs, hourly_rate, status, total_hours, rating, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const stationIds: number[] = [];
  STATIONS.forEach((s) => {
    const res = insertStation.run(
      s.name,
      s.kind,
      s.zone,
      s.specs,
      s.rate,
      s.status,
      s.hours,
      s.rating,
      iso(addDays(now, -760)),
    );
    stationIds.push(Number(res.lastInsertRowid));
  });

  const insertGame = db.prepare(
    `INSERT INTO games (title, platform, genre, players, age_rating, rating, status, copies, accent, release_year, description, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const gameIds: Record<string, number> = {};
  GAMES.forEach((g) => {
    const res = insertGame.run(
      g.title,
      g.platform,
      g.genre,
      g.players,
      g.age,
      g.rating,
      g.status,
      g.copies,
      g.accent,
      g.year,
      g.description,
      iso(addDays(now, -Math.floor(rand() * 400 + 60))),
    );
    gameIds[g.title] = Number(res.lastInsertRowid);
  });

  const insertBooking = db.prepare(
    `INSERT INTO bookings (member_id, station_id, game_id, start_time, end_time, status, players, total_amount, payment_status, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const insertTxn = db.prepare(
    `INSERT INTO transactions (member_id, type, amount, method, status, reference, description, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  const gameNames = GAMES.map((g) => g.title);
  const rateFor = (stationId: number) => {
    const idx = stationIds.indexOf(stationId);
    return STATIONS[idx]?.rate ?? 8;
  };

  const usedStations = new Set<number>();
  const bookStation = (preferred?: number) => {
    if (preferred) return preferred;
    const available = stationIds.filter((id) => !usedStations.has(id));
    const chosen = available.length ? pick(available) : pick(stationIds);
    usedStations.add(chosen);
    return chosen;
  };

  const makeBooking = (opts: {
    memberId: number;
    stationId?: number;
    start: Date;
    minutes: number;
    status: BookingStatus;
    payment: PaymentStatus;
    players?: number;
    game?: string;
    notes?: string;
  }) => {
    const stationId = bookStation(opts.stationId);
    const end = addMinutes(opts.start, opts.minutes);
    const rate = rateFor(stationId);
    const amount = Math.round((opts.minutes / 60) * rate * 100) / 100;
    const game = opts.game ?? pick(gameNames);
    insertBooking.run(
      opts.memberId,
      stationId,
      gameIds[game] ?? null,
      iso(opts.start),
      iso(end),
      opts.status,
      opts.players ?? intBetween(1, 2),
      amount,
      opts.payment,
      opts.notes ?? "",
      iso(addMinutes(opts.start, -intBetween(30, 240))),
    );
    return { stationId, amount, end, game };
  };

  /* ---- past two weeks: completed sessions + matching transactions ---- */
  for (let d = 14; d >= 1; d--) {
    const sessions = intBetween(3, 6);
    for (let s = 0; s < sessions; s++) {
      const start = atUtcHour(addDays(now, -d), intBetween(10, 21), pick([0, 15, 30, 45]));
      const mins = pick([60, 90, 120, 120, 150]);
      const memberId = pick(memberIds);
      const { amount, stationId } = makeBooking({
        memberId,
        start,
        minutes: mins,
        status: "completed",
        payment: "paid",
      });
      insertTxn.run(
        memberId,
        "booking",
        amount,
        pick(["card", "upi", "wallet", "cash"]),
        "paid",
        TXN_REF(),
        `Station session · ${STATIONS[stationIds.indexOf(stationId)].name}`,
        iso(addMinutes(start, mins)),
      );
      if (rand() > 0.55) {
        insertTxn.run(
          memberId,
          pick<TransactionType>(["snacks", "merchandise"]),
          between(3.5, 22),
          pick(["card", "cash", "upi"]),
          "paid",
          TXN_REF(),
          pick(["Energy drink + nachos", "Nexus hoodie", "Boba + fries", "Mousepad", "Pizza slice combo"]),
          iso(addMinutes(start, mins + 8)),
        );
      }
    }
  }

  /* ---- today: finished, live, and upcoming ---- */
  const todayDone = [
    { offset: -420, mins: 120 },
    { offset: -300, mins: 90 },
    { offset: -200, mins: 60 },
  ];
  todayDone.forEach(({ offset, mins }) => {
    const start = addMinutes(now, offset);
    const memberId = pick(memberIds);
    const { amount, stationId } = makeBooking({
      memberId,
      start,
      minutes: mins,
      status: "completed",
      payment: "paid",
    });
    insertTxn.run(
      memberId,
      "booking",
      amount,
      pick(["card", "upi", "wallet"]),
      "paid",
      TXN_REF(),
      `Station session · ${STATIONS[stationIds.indexOf(stationId)].name}`,
      iso(addMinutes(start, mins)),
    );
  });

  const liveSessions = [
    { station: 0, member: 0, offset: -72, mins: 120, game: "Valorant" },
    { station: 6, member: 5, offset: -48, mins: 120, game: "Tekken 8" },
    { station: 10, member: 13, offset: -35, mins: 90, game: "Beat Saber" },
  ];
  liveSessions.forEach((l) => {
    const start = addMinutes(now, l.offset);
    makeBooking({
      memberId: memberIds[l.member],
      stationId: stationIds[l.station],
      start,
      minutes: l.mins,
      status: "active",
      payment: "paid",
      players: l.game === "Beat Saber" ? 1 : 2,
      game: l.game,
      notes: "Walk-in session",
    });
    // Live session revenue is captured as it is booked.
    insertTxn.run(
      memberIds[l.member],
      "booking",
      Math.round(((l.mins / 60) * rateFor(stationIds[l.station]) + 3) * 100) / 100,
      pick(["card", "wallet", "upi"]),
      "paid",
      TXN_REF(),
      `Live session · ${STATIONS[l.station].name}`,
      iso(addMinutes(start, 2)),
    );
  });

  const upcomingToday = [
    { offset: 75, mins: 120, station: 1, game: "Counter-Strike 2" },
    { offset: 180, mins: 90, station: 12, game: "F1 25" },
    { offset: 260, mins: 120, station: 4, game: "League of Legends" },
  ];
  upcomingToday.forEach((u) => {
    makeBooking({
      memberId: pick(memberIds),
      stationId: stationIds[u.station],
      start: addMinutes(now, u.offset),
      minutes: u.mins,
      status: "upcoming",
      payment: pick<PaymentStatus>(["paid", "pending"]),
      game: u.game,
      players: intBetween(1, 2),
    });
  });

  /* ---- next week: upcoming reservations ---- */
  for (let d = 1; d <= 7; d++) {
    const sessions = intBetween(2, 4);
    for (let s = 0; s < sessions; s++) {
      const start = atUtcHour(addDays(now, d), intBetween(12, 21), pick([0, 30]));
      makeBooking({
        memberId: pick(memberIds),
        start,
        minutes: pick([60, 90, 120]),
        status: pick<BookingStatus>(["upcoming", "upcoming", "upcoming", "cancelled"]),
        payment: pick<PaymentStatus>(["paid", "pending"]),
        players: intBetween(1, 4),
      });
    }
  }

  /* ---- tournaments ---- */
  const insertTournament = db.prepare(
    `INSERT INTO tournaments (name, game_id, starts_at, entry_fee, prize_pool, max_players, registered, format, status, description, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  TOURNAMENTS.forEach((t) => {
    const starts =
      t.daysFromNow === 0
        ? addMinutes(now, -90)
        : atUtcHour(addDays(now, t.daysFromNow), t.hour, 0);
    insertTournament.run(
      t.name,
      gameIds[t.game] ?? null,
      iso(starts),
      t.fee,
      t.prize,
      t.max,
      t.registered,
      t.format,
      t.status,
      t.description,
      iso(addDays(now, -intBetween(10, 40))),
    );
  });

  /* ---- 30 days of wallet top-ups / merch so revenue charts look real ---- */
  const currentHour = now.getUTCHours();
  for (let d = 30; d >= 0; d--) {
    const count = d < 7 ? intBetween(2, 5) : intBetween(1, 3);
    /* Today's entries must not be timestamped in the future. */
    const hourFloor = d === 0 ? Math.min(9, Math.max(0, currentHour - 1)) : 11;
    const hourCeil = d === 0 ? Math.max(hourFloor, currentHour) : 22;
    for (let i = 0; i < count; i++) {
      const memberId = pick(memberIds);
      const type = pick<TransactionType>([
        "wallet_topup",
        "wallet_topup",
        "snacks",
        "merchandise",
        "tournament",
      ]);
      const amount =
        type === "wallet_topup"
          ? pick([20, 25, 50, 50, 75, 100])
          : type === "tournament"
            ? pick([8, 10, 12, 15])
            : between(3.5, 28);
      const created = atUtcHour(addDays(now, -d), intBetween(hourFloor, hourCeil), intBetween(0, 59));
      insertTxn.run(
        memberId,
        type,
        amount,
        pick(["card", "upi", "wallet", "cash"]),
        d === 0 && rand() > 0.9 ? "pending" : "paid",
        TXN_REF(),
        type === "wallet_topup"
          ? "Wallet top-up"
          : type === "tournament"
            ? "Tournament entry fee"
            : type === "merchandise"
              ? pick(["Nexus hoodie", "Nexus cap", "Controller grip kit"])
              : pick(["Energy drink + nachos", "Boba + fries", "Pizza slice combo"]),
        iso(created),
      );
    }
  }
}

export function seedDatabase(db: DatabaseSync) {
  const row = db.prepare("SELECT COUNT(*) AS c FROM members").get() as
    | { c: number }
    | undefined;
  if (row && Number(row.c) > 0) return;

  db.exec("BEGIN");
  try {
    insertAll(db);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    console.error("[seed] failed", error);
    throw error;
  }
}

export function resetDatabase(db: DatabaseSync) {
  db.exec("BEGIN");
  try {
    db.exec("DELETE FROM transactions");
    db.exec("DELETE FROM bookings");
    db.exec("DELETE FROM tournaments");
    db.exec("DELETE FROM games");
    db.exec("DELETE FROM stations");
    db.exec("DELETE FROM members");
    db.exec("DELETE FROM users");
    db.exec("DELETE FROM sqlite_sequence");
    insertAll(db);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
