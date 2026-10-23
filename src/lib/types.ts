export type Role = "owner" | "manager" | "staff";

export type StationKind = "PC" | "Console" | "VR" | "Racing" | "Retro";
export type StationStatus = "available" | "occupied" | "reserved" | "maintenance";

export type MemberTier = "Bronze" | "Silver" | "Gold" | "Platinum";
export type MemberStatus = "active" | "inactive" | "banned";

export type BookingStatus = "upcoming" | "active" | "completed" | "cancelled";
export type PaymentStatus = "paid" | "pending" | "refunded";

export type GameStatus = "available" | "maintenance" | "retired";

export type TournamentStatus = "draft" | "open" | "live" | "completed";

export type TransactionType =
  | "booking"
  | "tournament"
  | "wallet_topup"
  | "merchandise"
  | "snacks";
export type PaymentMethod = "card" | "cash" | "wallet" | "upi" | "crypto";
export type TransactionStatus = "paid" | "pending" | "failed" | "refunded";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  created_at: string;
}

export interface Member {
  id: number;
  name: string;
  email: string;
  phone: string;
  tier: MemberTier;
  status: MemberStatus;
  wallet_balance: number;
  joined_at: string;
  notes: string;
  avatar_color: string;
  total_spent?: number;
  bookings_count?: number;
}

export interface Station {
  id: number;
  name: string;
  kind: StationKind;
  zone: string;
  specs: string;
  hourly_rate: number;
  status: StationStatus;
  total_hours: number;
  rating: number;
  created_at: string;
}

export interface Game {
  id: number;
  title: string;
  platform: string;
  genre: string;
  players: string;
  age_rating: string;
  rating: number;
  status: GameStatus;
  copies: number;
  accent: string;
  release_year: number;
  description: string;
  created_at: string;
}

export interface Booking {
  id: number;
  member_id: number;
  station_id: number;
  game_id: number | null;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  players: number;
  total_amount: number;
  payment_status: PaymentStatus;
  notes: string;
  created_at: string;
  // joined
  member_name?: string;
  member_tier?: MemberTier;
  member_color?: string;
  station_name?: string;
  station_kind?: StationKind;
  game_title?: string;
}

export interface Tournament {
  id: number;
  name: string;
  game_id: number | null;
  starts_at: string;
  entry_fee: number;
  prize_pool: number;
  max_players: number;
  registered: number;
  format: string;
  status: TournamentStatus;
  description: string;
  created_at: string;
  game_title?: string;
  game_accent?: string;
}

export interface Transaction {
  id: number;
  member_id: number;
  type: TransactionType;
  amount: number;
  method: PaymentMethod;
  status: TransactionStatus;
  reference: string;
  description: string;
  created_at: string;
  member_name?: string;
  member_color?: string;
  member_tier?: MemberTier;
}

export interface ActivityItem {
  id: string;
  kind: "booking" | "transaction" | "member" | "tournament";
  title: string;
  detail: string;
  amount?: number;
  at: string;
  color: string;
}

export interface DashboardStats {
  revenueToday: number;
  revenueYesterday: number;
  revenueMonth: number;
  activeSessions: number;
  totalStations: number;
  occupiedStations: number;
  bookingsToday: number;
  bookingsYesterday: number;
  totalMembers: number;
  newMembersMonth: number;
  avgSessionMinutes: number;
  utilization: number;
}

export const STATION_KINDS: StationKind[] = ["PC", "Console", "VR", "Racing", "Retro"];
export const STATION_STATUSES: StationStatus[] = [
  "available",
  "occupied",
  "reserved",
  "maintenance",
];
export const MEMBER_TIERS: MemberTier[] = ["Bronze", "Silver", "Gold", "Platinum"];
export const MEMBER_STATUSES: MemberStatus[] = ["active", "inactive", "banned"];
export const BOOKING_STATUSES: BookingStatus[] = [
  "upcoming",
  "active",
  "completed",
  "cancelled",
];
export const PAYMENT_STATUSES: PaymentStatus[] = ["paid", "pending", "refunded"];
export const GAME_STATUSES: GameStatus[] = ["available", "maintenance", "retired"];
export const TOURNAMENT_STATUSES: TournamentStatus[] = [
  "draft",
  "open",
  "live",
  "completed",
];
export const TRANSACTION_TYPES: TransactionType[] = [
  "booking",
  "tournament",
  "wallet_topup",
  "merchandise",
  "snacks",
];
export const PAYMENT_METHODS: PaymentMethod[] = [
  "card",
  "cash",
  "wallet",
  "upi",
  "crypto",
];
export const TRANSACTION_STATUSES: TransactionStatus[] = [
  "paid",
  "pending",
  "failed",
  "refunded",
];
export const GENRES = [
  "FPS",
  "MOBA",
  "Battle Royale",
  "Sports",
  "Fighting",
  "Racing",
  "RPG",
  "Sandbox",
  "Party",
  "Rhythm",
];
export const PLATFORMS = ["PC", "PS5", "Xbox Series X", "Switch", "VR", "Multi"];
