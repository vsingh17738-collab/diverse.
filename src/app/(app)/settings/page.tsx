import { redirect } from "next/navigation";
import { SettingsView } from "@/components/settings/settings-view";
import { getCurrentUser } from "@/lib/auth";
import { get } from "@/lib/db";
import { getUsers } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings · Nexus Gaming Zone" };

function count(table: string) {
  return get<{ c: number }>(`SELECT COUNT(*) AS c FROM ${table}`)?.c ?? 0;
}

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <SettingsView
      user={user}
      users={getUsers()}
      counts={{
        members: count("members"),
        stations: count("stations"),
        bookings: count("bookings"),
        games: count("games"),
        tournaments: count("tournaments"),
        transactions: count("transactions"),
      }}
    />
  );
}
