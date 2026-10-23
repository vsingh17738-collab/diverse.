import {
  CalendarClock,
  Gamepad2,
  LayoutDashboard,
  MonitorPlay,
  Receipt,
  Settings,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
  group: "Overview" | "Operations" | "Community" | "System";
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    description: "Live overview of the floor",
    group: "Overview",
  },
  {
    href: "/stations",
    label: "Stations",
    icon: MonitorPlay,
    description: "Rigs, consoles and sim bays",
    group: "Operations",
  },
  {
    href: "/bookings",
    label: "Bookings",
    icon: CalendarClock,
    description: "Sessions and reservations",
    group: "Operations",
  },
  {
    href: "/games",
    label: "Game Library",
    icon: Gamepad2,
    description: "Titles available on the floor",
    group: "Operations",
  },
  {
    href: "/members",
    label: "Members",
    icon: Users,
    description: "Player accounts and wallets",
    group: "Community",
  },
  {
    href: "/tournaments",
    label: "Tournaments",
    icon: Trophy,
    description: "Brackets, prize pools, entries",
    group: "Community",
  },
  {
    href: "/transactions",
    label: "Transactions",
    icon: Receipt,
    description: "Payments and revenue ledger",
    group: "Community",
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    description: "Profile and workspace",
    group: "System",
  },
];

export const NAV_GROUPS: NavItem["group"][] = [
  "Overview",
  "Operations",
  "Community",
  "System",
];
